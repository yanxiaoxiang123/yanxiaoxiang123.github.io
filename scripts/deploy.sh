#!/usr/bin/env bash
# 打包静态产物，通过单次 SSH 会话执行持锁发布与失败恢复。
# 用法: DEPLOY_HOST=user@server DEPLOY_PATH=/var/www/yanxx ./scripts/deploy.sh
# 可选: DEPLOY_PORT=22、DEPLOY_KEY、SKIP_BUILD=1、DEPLOY_VERIFY_URL=http://127.0.0.1/
set -euo pipefail

: "${DEPLOY_HOST:?需要设置 DEPLOY_HOST，例如 user@your-server.com}"
: "${DEPLOY_PATH:?需要设置 DEPLOY_PATH，例如 /var/www/yanxx}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_VERIFY_URL="${DEPLOY_VERIFY_URL:-http://127.0.0.1/}"

fail() { printf '%s\n' "$*" >&2; exit 1; }
# Never allow a relative path, root, control characters or ambiguous dot segments.
while [[ "$DEPLOY_PATH" == */ ]]; do DEPLOY_PATH=${DEPLOY_PATH%/}; done
[[ "$DEPLOY_PATH" == /* && ! "$DEPLOY_PATH" =~ [[:cntrl:]] ]] || fail 'DEPLOY_PATH 必须是非根目录的绝对路径'
case "$DEPLOY_PATH/" in */../*|*/./*) fail 'DEPLOY_PATH 不能含 . 或 .. 路径段' ;; esac
[[ "$DEPLOY_PORT" =~ ^[0-9]+$ ]] || fail 'DEPLOY_PORT 必须是数字端口'
[[ "$DEPLOY_VERIFY_URL" == http://* || "$DEPLOY_VERIFY_URL" == https://* ]] || fail 'DEPLOY_VERIFY_URL 必须是 HTTP(S) 首页地址'

cd "$(dirname "$0")/.."
build_lock="$PWD/.yanxx-build.lock"
build_token=$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')
build_lock_owned=0
package=''
release_build_lock() {
  [[ "$build_lock_owned" == 1 ]] || return 0
  local state='' owner=''
  [[ ! -f .yanxx-build-state ]] || state=$(< .yanxx-build-state)
  # An interrupted Node/npm process may still have workers writing out/.
  if [[ "$state" == building || "$state" == interrupted ]]; then
    printf '保留本地构建锁；请核实构建及子进程均已停止：%s\n' "$build_lock" >&2
    return 1
  fi
  IFS= read -r owner < "$build_lock/owner" || return 1
  [[ "$owner" == "$build_token" ]] || return 1
  rm -f -- "$build_lock/owner" && rmdir -- "$build_lock" || return 1
  build_lock_owned=0
}
cleanup() {
  local status=$?
  trap '' HUP INT TERM
  trap - EXIT
  set +e
  release_build_lock || status=1
  [[ -z "$package" ]] || rm -rf -- "$package"
  exit "$status"
}
trap cleanup EXIT
interrupted=0
trap 'interrupted=129' HUP
trap 'interrupted=130' INT
trap 'interrupted=143' TERM
if mkdir -- "$build_lock" 2>/dev/null; then
  build_lock_owned=1
else
  fail '本地构建或打包锁已存在；核实 .yanxx-build.lock/owner 后再重试'
fi
printf '%s\npid=%s\nkind=deploy\n' "$build_token" "$$" > "$build_lock/owner"
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
[[ "$interrupted" == 0 ]] || exit "$interrupted"

if [[ "${SKIP_BUILD:-0}" != 1 ]]; then
  # Invalidate any old export before installation or the new build can fail.
  printf 'failed\n' > .yanxx-build-state
  npm ci
  YANXX_BUILD_LOCK_TOKEN="$build_token" npm run build
fi
if [[ -f .yanxx-build-state ]]; then
  [[ "$(< .yanxx-build-state)" == ready ]] || fail '最近一次构建未完成或失败；必须成功执行 npm run build 后才能发布'
fi

validate_export() {
  local directory=$1 invalid
  [[ -s "$directory/index.html" ]] && (cd -- "$directory" && compgen -G '_next/static/chunks/*.js' > /dev/null) || fail 'out/ 缺少非空首页或构建后的 JavaScript'
  invalid=$(find "$directory" ! -type d ! -type f -print -quit)
  [[ -z "$invalid" ]] || fail '发布产物只能包含普通文件和目录，不能包含符号链接或特殊文件'
}
validate_export out

# Hold the shared build lock until the private snapshot is complete. Subsequent
# builds can then run while this immutable package is hashed and uploaded.
package=$(mktemp -d)
mkdir -- "$package/site"
cp -R -- out/. "$package/site/"
validate_export "$package/site"
release_build_lock
(
  cd "$package/site"
  find . -type f -exec sha256sum -- {} + > "$package/SHA256SUMS"
)
file_count=$(find "$package/site" -type f -printf '.' | wc -c)
file_count=$((file_count))
tar -cf "$package/bundle.tar" -C "$package" site SHA256SUMS
archive_hash=$(sha256sum < "$package/bundle.tar")
archive_hash=${archive_hash%% *}
revision=$(git --no-pager rev-parse HEAD 2>/dev/null || printf 'unknown')
if [[ "$revision" != unknown && -n "$(git --no-pager status --porcelain)" ]]; then revision+='+worktree'; fi

SSH_ARGS=(-p "$DEPLOY_PORT")
if [[ -n "${DEPLOY_KEY:-}" ]]; then SSH_ARGS+=(-i "$DEPLOY_KEY"); fi
quote_arg() {
  local value=${1//\'/\'\"\'\"\'}
  printf "'%s'" "$value"
}
# The remote program uses stdin for the archive, so its source travels as one
# quoted bash argument. No upload can write directly into DEPLOY_PATH.
remote_script=$(< scripts/deploy-remote.sh)
remote_command="bash -c $(quote_arg "$remote_script") --"
for argument in "$DEPLOY_PATH" "$archive_hash" "$DEPLOY_VERIFY_URL" "$revision" "$file_count"; do
  remote_command+=" $(quote_arg "$argument")"
done
printf '==> 上传已打包产物并执行受锁保护的发布：%s:%s\n' "$DEPLOY_HOST" "$DEPLOY_PATH"
ssh "${SSH_ARGS[@]}" -- "$DEPLOY_HOST" "$remote_command" < "$package/bundle.tar"
