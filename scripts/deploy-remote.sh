#!/usr/bin/env bash
# Sent by deploy.sh as a Bash program; stdin is the verified local archive.
# Arguments: site, archive SHA-256, homepage URL, source revision, file count.
set -euo pipefail
umask 077

fail() { printf '%s\n' "$*" >&2; exit 1; }
[[ $# == 5 ]] || fail '需要站点、归档哈希、首页地址、源版本及文件数'
requested=$1
archive_hash=$2
verify_url=$3
revision=$4
file_count=$5
while [[ "$requested" == */ ]]; do requested=${requested%/}; done
[[ "$requested" == /* && ! "$requested" =~ [[:cntrl:]] ]] || fail '发布目标必须是非根目录的绝对路径'
case "$requested/" in */../*|*/./*) fail '发布目标不能含 . 或 .. 路径段' ;; esac
[[ "$archive_hash" =~ ^[a-f0-9]{64}$ && "$file_count" =~ ^[0-9]+$ ]] || fail '无效的构建校验信息'
for tool in basename dirname mkdir mktemp cat tar sha256sum find wc cp cmp chmod mv rm rmdir date nginx systemctl curl; do
  command -v "$tool" > /dev/null || fail "服务器缺少工具：$tool"
done
# Canonicalize the parent so aliases to the same directory share one lock.
parent=$(cd -- "$(dirname -- "$requested")" && pwd -P)
name=$(basename -- "$requested")
site="${parent%/}/$name"
[[ ! -L "$site" ]] || fail '正式站点不能是符号链接'
lock="${parent%/}/.$name.deploy.lock"
lock_owned=0
release=''
previous=''
old_hash=''
had_old=0
switch_started=0
completed=0
hash_file() {
  local result
  result=$(sha256sum < "$1") || return
  printf '%s' "${result%% *}"
}
verify_home() {
  local code actual
  code=$(curl --fail --silent --show-error --noproxy '*' --connect-timeout 5 --max-time 15 \
    --output "$release/http.html" --write-out '%{http_code}' "$verify_url") || return 1
  [[ "$code" == 200 ]] || return 1
  actual=$(hash_file "$release/http.html") || return 1
  [[ "$actual" == "$1" ]]
}
# Copy only missing hashed resources. This also runs during rollback: a visitor
# may already have received the candidate homepage before its health check fails.
preserve_static() (
  umask 022
  local source=$1 target=$2 invalid resource relative
  [[ -d "$source/_next/static" ]] || return 0
  invalid=$(find "$source/_next/static" ! -type d ! -type f -print -quit) || return 1
  [[ -z "$invalid" ]] || return 1
  find "$source/_next/static" -type f -print0 > "$release/resources" || return 1
  while IFS= read -r -d '' resource; do
    relative=${resource#"$source/"}
    if [[ ! -e "$target/$relative" ]]; then
      mkdir -p -- "$(dirname -- "$target/$relative")" || return 1
      cp -- "$resource" "$target/$relative" || return 1
      cmp -s -- "$resource" "$target/$relative" || return 1
    fi
  done < "$release/resources"
)
restore_previous() {
  if [[ -d "$previous" ]]; then
    if [[ -e "$site" || -L "$site" ]]; then
      preserve_static "$site" "$previous" || return 1
      mv -T -- "$site" "$release/failed" || return 1
    fi
    mv -T -- "$previous" "$site" || return 1
    nginx -t && systemctl reload nginx && verify_home "$old_hash" || return 1
  elif [[ "$had_old" == 0 && "$switch_started" == 1 && -d "$site" ]]; then
    mv -T -- "$site" "$release/failed" || return 1
    nginx -t && systemctl reload nginx || return 1
  fi
  printf 'rolled-back\n' > "$release/state"
}
cleanup() {
  local status=$? keep_lock=0
  # Recovery must finish even if SSH or the operator sends another signal.
  trap '' HUP INT TERM
  trap - EXIT
  set +e
  if [[ "$completed" == 0 ]]; then
    [[ "$status" != 0 ]] || status=1
    # Inspect the filesystem, not a flag set after mv: signals can arrive in
    # between the rename and the next shell statement.
    if [[ -n "$release" && ( -d "$previous" || ( "$had_old" == 0 && "$switch_started" == 1 && -d "$site" ) ) ]]; then
      if restore_previous; then
        printf '发布失败，已恢复发布前状态：%s\n' "$site" >&2
      else
        keep_lock=1
        printf 'rollback-failed\n' > "$release/state"
        printf '自动恢复失败！保留锁、备份和失败产物，请人工核实：%s\n' "$release" >&2
      fi
    elif [[ -n "$release" ]]; then
      printf 'failed-before-switch\n' > "$release/state"
    fi
    [[ -z "$release" ]] || printf '发布记录：%s\n' "$release" >&2
  fi
  if [[ "$lock_owned" == 1 && "$keep_lock" == 0 ]]; then
    rm -f -- "$lock/owner" && rmdir -- "$lock" || { printf '无法释放发布锁：%s\n' "$lock" >&2; status=1; }
  fi
  exit "$status"
}
trap cleanup EXIT
# Defer termination until mkdir's result is recorded, so cleanup can distinguish
# our new lock from another publisher's existing lock even at this boundary.
interrupted=0
trap 'interrupted=129' HUP
trap 'interrupted=130' INT
trap 'interrupted=143' TERM
if mkdir -- "$lock" 2>/dev/null; then
  lock_owned=1
else
  fail "发布锁已存在，停止发布；先核实进程及 $lock/owner，不能直接删除锁"
fi
printf 'pid=%s\nsite=%s\n' "$$" "$site" > "$lock/owner"
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
[[ "$interrupted" == 0 ]] || exit "$interrupted"

release=$(mktemp -d "${parent%/}/.$name.release.XXXXXXXX")
previous="$release/previous"
printf 'pid=%s\nrelease=%s\nsite=%s\n' "$$" "$release" "$site" > "$lock/owner"
printf 'created_utc=%s\nsource_revision=%s\narchive_sha256=%s\nfile_count=%s\nsite=%s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$revision" "$archive_hash" "$file_count" "$site" > "$release/metadata"
printf 'uploading\n' > "$release/state"
# Repeat the link check under the lock and refuse unknown existing content.
[[ ! -L "$site" ]] || fail '正式站点不能是符号链接'
if [[ -e "$site" ]]; then
  [[ -d "$site" && -s "$site/index.html" ]] || fail '现有站点不是包含非空首页的目录，停止发布'
  had_old=1
  old_hash=$(hash_file "$site/index.html")
fi
nginx -t
printf '==> 暂存及发布记录：%s\n' "$release"
cat > "$release/bundle.tar"
[[ "$(hash_file "$release/bundle.tar")" == "$archive_hash" ]] || fail '上传归档 SHA-256 不匹配，正式目录保持不动'
tar -xf "$release/bundle.tar" -C "$release" --no-same-owner --no-same-permissions
ready="$release/site"
[[ -s "$ready/index.html" ]] && (cd -- "$ready" && compgen -G '_next/static/chunks/*.js' > /dev/null) || fail '暂存目录缺少首页或 JavaScript'
invalid=$(find "$ready" ! -type d ! -type f -print -quit)
[[ -z "$invalid" ]] || fail '暂存目录包含符号链接或特殊文件'
actual_count=$(find "$ready" -type f -printf '.' | wc -c)
[[ "$actual_count" -eq "$file_count" ]] || fail '暂存文件数量不匹配'
(cd "$ready" && sha256sum --check --status "$release/SHA256SUMS")
new_hash=$(hash_file "$ready/index.html")

# Preserve old lazy-loaded resources at their original URLs. The old site is
# read-only here; resources supplied by the candidate always take precedence.
preserve_static "$site" "$ready" || fail '无法保留旧静态资源，停止发布'
(cd "$ready" && sha256sum --check --status "$release/SHA256SUMS")
find "$ready" -type d -exec chmod 755 {} +
find "$ready" -type f -exec chmod 644 {} +
printf 'old_index_sha256=%s\nnew_index_sha256=%s\n' "$old_hash" "$new_hash" >> "$release/metadata"
printf 'verified\n' > "$release/state"

# All writers must honor this lock. Detect an out-of-band homepage change too.
if [[ "$had_old" == 1 ]]; then
  [[ "$(hash_file "$site/index.html")" == "$old_hash" ]] || fail '当前首页在发布期间发生变化，停止切换'
else
  [[ ! -e "$site" && ! -L "$site" ]] || fail '发布期间出现了新的站点目录，停止切换'
fi
printf 'switching\n' > "$release/state"
switch_started=1
if [[ "$had_old" == 1 ]]; then mv -T -- "$site" "$previous"; fi
mv -T -- "$ready" "$site"
systemctl reload nginx
verify_home "$new_hash" || fail '新首页 HTTP 状态或内容哈希不匹配'
printf 'active\n' > "$release/state"
completed=1
printf '==> 发布完成；记录：%s；旧版本备份：%s\n' "$release" "$previous"
