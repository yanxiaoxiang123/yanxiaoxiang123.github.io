# 部署

站点是纯静态导出（`out/`），无后端。两种上线方式，二选一或同时使用。

## 一、GitHub Pages（自动）

仓库：`yanxiaoxiang123/yanxiaoxiang123.github.io`

1. 推送到 `main` 分支。
2. GitHub Actions 运行 `.github/workflows/deploy.yml`：`npm ci` → `npm run build` → 发布 `out/`。
3. Pages 设置需为 **Build and deployment → Source: GitHub Actions**。
4. 访问 https://yanxiaoxiang123.github.io/ 。

首次启用（仓库 Settings → Pages → Source 选 GitHub Actions），或命令行：

```bash
gh api -X POST repos/yanxiaoxiang123/yanxiaoxiang123.github.io/pages -f build_type=workflow
```

绑定自定义域名：Settings → Pages → Custom domain，填你的域名；并在域名 DNS 添加
`CNAME` 记录指向 `yanxiaoxiang123.github.io`。

## 二、自有服务器（Rocky Linux）

前提：服务器已装 `nginx`、`rsync`，本机可通过 SSH 免密登录。

### 1. 本机构建并同步

```bash
DEPLOY_HOST=root@your-server.com DEPLOY_PATH=/var/www/yanxx ./scripts/deploy.sh
```

Windows 下可用 Git Bash 运行，或改用下方的手动步骤。

### 2. Nginx 配置

`/etc/nginx/conf.d/yanxx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/yanxx;
    index index.html;

    # 静态资源缓存
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # App Router 导出：未知路径回落到 404 页
    error_page 404 /404.html;
    location = /404.html {
        internal;
    }

    location / {
        try_files $uri $uri/ $uri.html =404;
    }
}
```

### 3. 重载

```bash
nginx -t && systemctl reload nginx
```

HTTPS 用 `certbot --nginx -d your-domain.com` 即可自动签发并配置。

### 手动同步（无 rsync 时）

```bash
npm run build
scp -r out/* root@your-server.com:/var/www/yanxx/
```

## 自定义域名

同一个 `out/` 同时适用于 Pages 和服务器；域名解析到哪里，就由哪里提供内容。
若同时使用，建议 Pages 用 `www`、服务器用裸域名，避免两边内容分叉。
