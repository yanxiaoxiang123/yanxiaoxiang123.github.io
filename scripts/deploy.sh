#!/usr/bin/env bash
# 把构建产物 out/ 同步到自己的服务器。
#
# 用法:
#   DEPLOY_HOST=user@your-server.com DEPLOY_PATH=/var/www/yanxx ./scripts/deploy.sh
#
# 可选环境变量:
#   DEPLOY_PORT    SSH 端口，默认 22
#   DEPLOY_KEY     SSH 私钥路径，默认用 ssh-agent / ~/.ssh/config
#   SKIP_BUILD=1   跳过 npm run build（复用现有 out/）

set -euo pipefail

: "${DEPLOY_HOST:?需要设置 DEPLOY_HOST，例如 user@your-server.com}"
: "${DEPLOY_PATH:?需要设置 DEPLOY_PATH，例如 /var/www/yanxx}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

cd "$(dirname "$0")/.."

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "==> 构建静态站点"
  npm ci
  npm run build
fi

if [[ ! -d out ]]; then
  echo "out/ 不存在，构建可能失败" >&2
  exit 1
fi

KEY_ARG=()
if [[ -n "${DEPLOY_KEY:-}" ]]; then
  KEY_ARG=(-i "$DEPLOY_KEY")
fi

echo "==> 同步 out/ 到 ${DEPLOY_HOST}:${DEPLOY_PATH}"
ssh "${KEY_ARG[@]}" -p "$DEPLOY_PORT" "$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"

rsync -az --delete \
  -e "ssh ${KEY_ARG[*]:-} -p $DEPLOY_PORT" \
  out/ "${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "==> 完成。确认 Nginx/Apache 已把站点根目录指向 ${DEPLOY_PATH}"
