# 部署与回滚

本站使用 Next.js 静态导出，发布产物为 `out/`，由静态服务器直接提供文件。应用构建需要 Node.js；自有服务器通过 Nginx 提供站点，无需运行 Next.js 服务进程。

## 当前发布目标

| 目标 | 入口 | 发布方式 |
| --- | --- | --- |
| GitHub Pages | https://yanxiaoxiang123.github.io/ | 推送 `main` 后由 GitHub Actions 自动构建发布 |
| 自有服务器 | http://43.142.9.102/ | 上传已验证的静态发布包，备份并切换站点目录 |

推送仓库不会自动更新自有服务器。两处部署应记录各自的应用提交和验证结果；仅修改 Nginx 配置或部署文档时，不需要重新上传站点文件。

当前自有服务器为 Rocky Linux 9.4、Nginx 1.20.1：

- 站点目录：`/var/www/yanxx`。
- 站点配置：`/etc/nginx/conf.d/yanxx.conf`，监听 HTTP 80，作为默认站点。
- 服务管理：systemd 管理 Nginx，已设置开机启动。
- 当前使用 IP 访问；自有服务器尚未配置 HTTPS，域名仍受此前备案条件限制。域名和证书变更需要单独核实，不属于现有发布步骤。

## GitHub Pages 自动发布

仓库：[yanxiaoxiang123/yanxiaoxiang123.github.io](https://github.com/yanxiaoxiang123/yanxiaoxiang123.github.io)。工作流定义在 [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)。

1. 将已验证的提交推送至 `main`。
2. Actions 使用 Node.js 22，执行 `npm ci`、`npm run build`，上传 `out/` 并发布 Pages。
3. 核对工作流的提交 SHA 和成功状态；首次配置时，Pages 的发布来源应为 **GitHub Actions**。
4. 检查公开首页和资源。工作流成功与浏览器交互验证应分别记录。

GitHub Pages 不使用自有服务器的 Nginx 配置，下面的缓存规则只作用于自有服务器。

## 自有服务器发布流程

采用独立暂存目录和保留旧版本的目录切换流程。发布期间不在当前站点内逐文件覆盖，也不先清空当前站点。

### 1. 验证本地构建

在项目根目录执行：

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

构建会完成 TypeScript 检查并生成 `out/`。根据本次变更运行必要的浏览器回归；打包前确认 `out/` 没有诊断页面、测试 harness、环境配置或私有材料。

发布包只包含 `out/` 的内容，归档内的顶层应直接是 `index.html`、`_next/`、`images/` 等，而不是额外嵌套一个 `out/` 目录。目录权限为 755、普通文件为 644，不包含符号链接。

为每次发布记录：

- 应用提交的完整 SHA。
- 唯一发布标识：UTC 时间与提交短 SHA，例如 `<UTC时间>-<提交短SHA>`。
- 发布包的 SHA-256、首页 `index.html` 的 SHA-256，以及文件数量。

归档必须对应本次已验证的构建。凭据保存在 SSH 密钥或本机运行环境中，不写入仓库或发布包；Windows 本机已使用 Paramiko 的 SSH/SFTP 方式发布。

### 2. 预检与上传暂存

先通过 SSH 检查当前站点、首页哈希和 Nginx 配置，再上传：

| 路径 | 用途 |
| --- | --- |
| `/tmp/yanxx-<发布标识>.tgz` | 上传的发布包 |
| `/tmp/yanxx-release-<发布标识>` | 新建的解压与校验目录 |
| `/var/www/.yanxx-ready-<发布标识>` | 与正式站点位于同一文件系统的待切换目录 |
| `/var/www/yanxx-backup-<发布标识>` | 本次切换前的完整站点备份 |

这些路径中的发布标识需要由本次发布生成，并确认暂存、待切换和备份路径尚不存在。不要复用上次发布的路径或校验记录。

上传后核对远端归档 SHA-256，在新建的 `/tmp` 暂存目录解压，再核对解压后的首页哈希和产物内容。此阶段不改变 `/var/www/yanxx`。

切换前检查：

- 当前正式站点的首页哈希仍与预检记录一致，避免覆盖其他刚发生的发布。
- 暂存目录的内容仍与本次发布记录一致。
- `nginx -t` 通过。

### 3. 保留备份并切换版本

将已校验的暂存目录完整复制到 `/var/www/.yanxx-ready-<发布标识>`，再次核对首页哈希和读取权限。

随后按顺序执行目录切换：

1. 将 `/var/www/yanxx` 重命名为本次备份目录。
2. 将本次待切换目录重命名为 `/var/www/yanxx`。
3. 检查 Nginx 配置并平滑重载。

目前使用两次目录重命名，存在短暂的目录切换窗口，不承诺零停机。切换必须带有下面的失败恢复逻辑。

在服务器上检查并重载的命令为：

```bash
nginx -t && systemctl reload nginx
```

### 4. 验证发布

先请求服务器本机的 `http://127.0.0.1/`，再检查公网入口：

- 首页返回 200，SHA-256 与本次构建一致。
- 首屏与延迟加载的 JS/CSS、图片可访问，内容与发布产物一致，JS/CSS 的 MIME 类型正确。
- 不存在的路径返回 404。直接校验 `/404.html` 时应预期 404，并核对错误页内容。
- 图片缓存头及条件请求正常；带哈希 JS/CSS 的长期缓存保持正常。
- 根据本次应用变更检查浏览器交互，分别注明本地构建验证和线上验证的范围。

只有切换和必要验证通过后才记录发布成功。记录应用提交、站点地址、首页哈希和备份路径；验证受环境限制时应明确记录限制，不能将其计为通过。

### 5. 失败恢复

- 暂存或切换前校验失败：停止发布，保持正式站点不动。
- 旧目录已移为备份，但新目录尚未成功就位：将本次备份目录恢复到 `/var/www/yanxx`。
- 新版本已就位，但重载或发布验证失败：先将失败版本移到独立目录，再把本次备份目录恢复为 `/var/www/yanxx`；重新检查 Nginx、重载并验证旧首页。

恢复前必须核实本次发布记录和路径，避免操作其他发布的目录。保留失败版本用于排查；新版本稳定后再按保留策略清理历史产物，确保仍有可回滚版本。

同机的站点目录备份用于版本回滚；云快照、异地备份和外部可用性告警需另行确认。

## Nginx 配置维护

应用发布只切换站点目录，不覆盖 `/etc/nginx/conf.d/yanxx.conf`。修改 Nginx 时先读取并备份当前配置，在候选配置通过验证后替换、检查并平滑重载；失败时恢复配置备份并再次检查、重载。

配置备份保存在 `/etc/nginx/yanxx.conf.backup-<标识>` 等不被 `conf.d/*.conf` 自动加载的位置。保留现有站点中的其他配置，例如 ACME 路径处理；不要用最小示例整段覆盖生产配置。

当前缓存与路由规则如下，放在现有站点的 `server` 块内：

```nginx
# 构建时带哈希的静态资源
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}

# 固定文件名图片；对应 ops/nginx/images-cache.conf
location ^~ /images/ {
    expires off;
    etag on;
    if_modified_since exact;
    add_header Cache-Control "public, max-age=3600, must-revalidate";
    try_files $uri =404;
}

error_page 404 /404.html;
location = /404.html {
    internal;
}

location / {
    try_files $uri $uri/ $uri.html =404;
}
```

可复用的图片规则见 [ops/nginx/images-cache.conf](../ops/nginx/images-cache.conf)。

- `/images/` 在一小时内可以直接复用，过期后通过 ETag 或 Last-Modified 重新校验，未变化时返回 304。
- 图片使用固定文件名，不设置一年 `immutable`。同名图片替换后，已缓存浏览器可能最多继续显示旧图片一小时；需要立即更新时应更换 URL 或显式更新资源版本。
- 图片的 HEAD、Range 请求和缺失文件的 404 均应保持正常。首页不套用图片缓存策略。
- Nginx 配置备份与站点内容备份分别管理，回滚其中一项时需确认另一项是否也需要恢复。
