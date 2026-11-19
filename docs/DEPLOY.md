# 部署与回滚

本站使用 Next.js 静态导出，发布产物为 `out/`，由静态服务器直接提供文件。应用构建需要 Node.js；自有服务器通过 Nginx 提供站点，无需运行 Next.js 服务进程。

## 当前发布目标

| 目标 | 入口 | 发布方式 |
| --- | --- | --- |
| GitHub Pages | https://yanxiaoxiang123.github.io/ | 推送 `main` 后由 GitHub Actions 自动构建发布 |
| 自有服务器 | https://yanxx.site/（IP：http://43.142.9.102/） | 上传已验证的静态发布包，备份并切换站点目录 |

推送仓库不会自动更新自有服务器。两处部署应记录各自的应用提交和验证结果；仅修改 Nginx 配置或部署文档时，不需要重新上传站点文件。

当前自有服务器为 Rocky Linux 9.4、Nginx 1.20.1：

- 站点目录：`/var/www/yanxx`。
- 站点配置：`/etc/nginx/conf.d/yanxx.conf`（HTTP 80 默认站点）和 `/etc/nginx/conf.d/yanxx-https.conf`（域名 443）。
- 服务管理：systemd 管理 Nginx，已设置开机启动。
- 域名 `yanxx.site`、`www.yanxx.site` 已启用 HTTPS；IP 入口继续使用 HTTP。证书、跳转和续期见[域名与 HTTPS](#域名与-https)。

## 域名与 HTTPS

`yanxx.site` 和 `www.yanxx.site` 的 DNS A 记录都指向 `43.142.9.102`，两个域名均已启用 HTTPS；IP 入口 `http://43.142.9.102/` 继续使用 HTTP。证书不包含 IP，因此不提供 IP 的 HTTPS，浏览器直接访问 IP 的 443 会提示名称不匹配。

| 项目 | 位置或值 |
| --- | --- |
| 443 站点 | `/etc/nginx/conf.d/yanxx-https.conf`：`listen 443 ssl http2`，TLS 1.2/1.3，站点根目录与 80 站点相同 |
| HTTP 跳转 | `/etc/nginx/conf.d/yanxx.conf` 的 `server` 块内按 `$host` 判断：域名请求 301 到 HTTPS，IP 和其他 Host 继续返回站点内容 |
| 证书链 | `/etc/nginx/ssl/yanxx.site/yanxx.site_bundle.pem`（644，含中间证书） |
| 私钥 | `/etc/nginx/ssl/yanxx.site/yanxx.site.key`（600，仅 root 可读） |
| 证书信息 | TrustAsia DV TLS RSA CA 2024 签发，覆盖 `yanxx.site`、`www.yanxx.site`，有效期至 2027-02-10（UTC） |

- 私钥只保存在服务器和签发机构的交付包中，不进入 Git、发布包或文档。
- HTTP 的 `/.well-known/acme-challenge/` 不参与跳转，保留以后使用 ACME 续签的可能。
- `www` 与根域名返回同一站点内容，目前不做域名间跳转。
- **公网 443 必须在云安全组（以及云防火墙，如有）中放行。** 2026-11-19 排障时，服务器本机访问 443 正常，但公网报文到不了主机：服务器抓包没有收到任何 443 报文，外部 SSL 检测也无法连接；放行入站 TCP 443 后恢复。遇到 HTTPS 超时但本机访问正常，先检查云侧规则，修改 Nginx 没有作用。
- 主机上 firewalld 未启用、SELinux 为 Disabled；入站限制以云安全组为准。

验证命令：

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://yanxx.site/
```

```bash
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://yanxx.site/
```

```bash
curl -sSI https://yanxx.site/images/stickers/bull.png | grep -i cache-control
```

预期：HTTPS 首页返回 200，HTTP 域名返回 301 到对应 HTTPS 地址，图片仍返回 `public, max-age=3600, must-revalidate`；`openssl s_client -connect 43.142.9.102:443 -servername yanxx.site` 应显示 `Verify return code: 0 (ok)`。

### 证书续期

1. 从签发机构获取覆盖两个域名的新证书链和私钥，确认域名、有效期以及证书与私钥匹配。
2. 备份 `/etc/nginx/ssl/yanxx.site/` 下的现有文件。
3. 替换证书链和私钥，保持 644/600 权限；路径和文件名不变时无需修改 Nginx 配置。
4. 执行 `nginx -t && systemctl reload nginx`，按本节命令验证两个域名、跳转和首页哈希。
5. 更新本节记录的有效期。

## GitHub Pages 自动发布

仓库：[yanxiaoxiang123/yanxiaoxiang123.github.io](https://github.com/yanxiaoxiang123/yanxiaoxiang123.github.io)。工作流定义在 [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)。

1. 将已验证的提交推送至 `main`。
2. Actions 使用 Node.js 22，执行 `npm ci`、`npm run build`，上传 `out/` 并发布 Pages。
3. 核对工作流的提交 SHA 和成功状态；首次配置时，Pages 的发布来源应为 **GitHub Actions**。
4. 检查公开首页和资源。工作流成功与浏览器交互验证应分别记录。

GitHub Pages 不使用自有服务器的 Nginx 配置，下面的缓存规则只作用于自有服务器。

## 自有服务器发布流程

使用 [scripts/deploy.sh](../scripts/deploy.sh)。脚本先对本地 `out/` 制作快照和完整归档，通过一次 SSH 会话上传到独立目录；服务器从预检到 HTTP 验证始终持有同一个发布锁。上传及校验阶段不修改正式目录，切换后保留旧版本，失败时自动恢复。

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

构建会完成 TypeScript 检查并生成 `out/`。[scripts/build.mjs](../scripts/build.mjs) 为 `npm run build` 获取项目根目录的 `.yanxx-build.lock/`，与部署的依赖安装、构建和快照阶段互斥；争用时立即失败。部署持锁调用构建时，通过内部所有者标识复用同一把锁，快照完成后释放，因此后续构建可以与已打包产物的上传同时进行。

构建状态写入本地 `.yanxx-build-state`：`building`、`ready`、`failed` 或 `interrupted`。只有构建成功才记为 `ready`；已有状态不是 `ready` 时，即便设置 `SKIP_BUILD=1` 也拒绝发布。旧版构建若没有状态文件，仍执行首页、JS 及文件类型校验，但不能据此证明它来自一次完整构建，建议先执行上述构建命令。锁和状态均不进入 Git 或发布包。

所有本地构建应使用 `npm run build`；直接执行 `next build`、在另一终端执行 `npm ci` 或手动改写 `out/` 不受这把锁保护，不得与构建或打包并行。普通构建失败会释放锁并保留失败状态；构建收到中断信号时保留锁，须读取 `owner`、核实构建和子进程均已停止后再清理锁，并成功重新构建。断电或强制终止也需这样处理，脚本不自动抢锁。

根据应用变更运行必要的浏览器回归；打包前确认 `out/` 没有诊断页面、测试 harness、环境配置或私有材料。发布产物只能包含普通文件和目录，不能包含符号链接或特殊文件。

### 2. 执行受锁保护的发布

本机需要 Node.js、Bash、OpenSSH 和 GNU 文件工具（包括 `tar`、`find`、`sha256sum`）；即使复用构建也需要 Node.js 管理本地构建锁，不再依赖 rsync。服务器需要 Bash、GNU 文件工具、curl、Nginx 和 systemd。SSH 用户必须有权限在站点父目录创建和重命名目录，并执行 `nginx -t` 与 `systemctl reload nginx`；脚本不会自动调用 sudo。

站点父目录必须已存在。`DEPLOY_PATH` 必须是非根目录的绝对路径，不能含 `.`、`..` 路径段；正式目录不能是符号链接。已有站点必须包含非空首页；目标尚不存在时支持首次发布。需要有空间同时容纳当前版本、本地归档的远端副本、待发布目录和保留的历史版本。

```bash
DEPLOY_HOST=user@your-server.com DEPLOY_PATH=/var/www/yanxx bash scripts/deploy.sh
```

| 参数 | 含义 |
| --- | --- |
| `DEPLOY_HOST` | 必填，SSH 目标，例如 `user@your-server.com`。 |
| `DEPLOY_PATH` | 必填，Nginx 的正式站点目录，例如 `/var/www/yanxx`。 |
| `DEPLOY_PORT` | SSH 端口，默认 22。 |
| `DEPLOY_KEY` | 可选 SSH 私钥路径；支持空格和单引号。未设置时使用 SSH 默认配置。 |
| `SKIP_BUILD=1` | 复用已验证的 `out/`，仍取得本地快照锁并检查构建状态；默认执行 `npm ci` 和 `npm run build`。 |
| `DEPLOY_VERIFY_URL` | 服务器发起的首页校验地址，默认 `http://127.0.0.1/`。虚拟主机需设置为服务器可访问、直接返回本站首页的地址。 |

凭据保存在 SSH 密钥或本机环境中，不写入仓库或发布包。仓库提交不会自动更新自有服务器；执行脚本本身才会连接并变更该目标。

### 3. 自动校验、切换和记录

以 `/var/www/yanxx` 为例，服务器会创建：

| 路径 | 用途 |
| --- | --- |
| `/var/www/.yanxx.deploy.lock/owner` | 原子创建目录取得的互斥锁，记录发布进程 PID、正式目录和本次发布记录路径。 |
| `/var/www/.yanxx.release.<随机标识>/bundle.tar` | 本次上传的归档；验证 SHA-256 后才解包。 |
| 发布记录目录中的 `site/` | 待切换目录，逐文件 SHA-256 和文件数校验通过后才使用。 |
| 发布记录目录中的 `previous/` | 切换前的完整正式站点；成功后保留，首次发布时不存在。 |
| 发布记录目录中的 `failed/` | 切换后验证失败的新版本，恢复时保留用于排查。 |
| 发布记录目录中的 `metadata`、`state`、`SHA256SUMS` | UTC 时间、源版本、归档/首页哈希、文件数量、阶段及新版本文件清单。 |

发布记录目录由 `mktemp` 唯一创建，并与正式站点位于同一文件系统。父目录别名会规范化后再取锁；锁已存在时立即失败，不等待、不自动抢锁。所有自动或人工发布都必须遵守这把锁，不得另用原地同步绕过它。

执行顺序：

1. 取得锁，记录已有首页哈希，执行 `nginx -t`。
2. 接收完整归档，验证归档 SHA-256，再解包到独立目录，检查逐文件 SHA-256、文件数量、首页及 JS 产物。
3. 将旧站点 `/_next/static/` 中新版本缺少的资源复制到待切换目录并逐个核对；保留新版本的同名文件。这样已打开的旧页面仍能请求延迟加载的模块。
4. 将待切换目录权限设为 755、普通文件设为 644，再次核对新版本文件及原站点首页。校验信息保存在发布记录目录，不放进公开站点。
5. 将原正式目录移动到 `previous/`，再将待切换目录移动到正式路径。两次重命名之间有短暂窗口，不承诺零停机。
6. 重载 Nginx，通过 HTTP 请求首页，必须返回 200，且响应内容 SHA-256 与新版本一致。通过后将 `state` 设为 `active` 并释放锁。

源版本记录当前完整提交 SHA，工作区有未提交内容时加 `+worktree`；不在 Git 仓库中时记为 `unknown`。这只是来源提示，不能证明复用的 `out/` 对应该提交；本次归档与文件哈希才描述实际上传内容。成功日志会打印本次发布记录和备份路径，需与公网验证结果一起留存。

### 4. 失败恢复与异常中断

- 暂存、预检或切换前校验失败：正式站点不动，保留失败记录，释放锁。
- 旧目录已移走，但新目录未成功就位：自动将 `previous/` 恢复到正式路径。
- 新版本已就位，但重载或首页验证失败：先将新版本中旧站点缺少的 `/_next/static/` 资源复制并核对到 `previous/`，保留旧版本同名文件；随后将新目录移至 `failed/` 并恢复旧目录，重新检查和重载 Nginx，再通过 HTTP 核对旧首页哈希。这样已经收到新首页的访问者在回滚后仍能请求新版本的哈希资源；固定文件名内容仍随旧版本恢复。
- 首次发布失败：移走已就位的新目录，恢复发布前“站点不存在”的状态。
- HUP、INT、TERM：走同一恢复逻辑；取得远端锁时先延后处理信号，记录锁归属后再退出，避免遗留无主锁或误删别人的锁。恢复过程中忽略后续同类信号，直到恢复完成或确认失败；判断真实目录位置，避免信号恰好发生在重命名后、状态变量更新前时漏恢复。
- 自动恢复自身失败：保留锁和全部可用备份，`state` 记为 `rollback-failed`，返回非零并输出人工处理路径，阻止下一次发布继续覆盖。

普通命令错误可自动处理；断电、内核崩溃或 SIGKILL 无法由 Bash trap 捕获，可能留下锁和中间目录。SSH 断线也不能仅凭本机退出状态断言服务器已恢复或已成功，必须重新核实记录和当前站点。

人工处理前，先读取锁的 `owner`、发布记录的 `metadata` 和 `state`，核实服务器上是否仍有对应发布进程，确认正式目录、`previous/`、`failed/` 各自的首页哈希。不要仅凭 PID 或锁的年龄自动解锁。若旧目录已恢复但 HTTP 校验失败，`previous/` 可能已不存在，应先排查服务或校验地址，不能盲目再次移动目录。恢复站点并完成 Nginx、HTTP 校验，且确认原发布进程已停止后，才清理该锁。

脚本不自动删除历史版本和旧哈希资源。清理需在没有发布运行时，核对发布记录、保留周期和可回滚版本后单独执行；同机备份用于版本回滚，云快照、异地备份及外部可用性告警需另行确认。

### 5. 公网发布验证

脚本自动验证的是服务器发起的首页 HTTP 状态和内容哈希；发布后还需检查公网入口并记录结果：

- 首页及首屏、延迟加载的 JS/CSS、图片可访问，内容与发布产物一致，JS/CSS 的 MIME 类型正确。
- 域名 HTTPS：`https://yanxx.site/` 与 `https://www.yanxx.site/` 均返回 200，内容哈希与发布产物一致；`http://` 域名返回 301 到对应 HTTPS 地址。
- IP 入口 `http://43.142.9.102/` 仍返回 200；IP 的 HTTPS 不在本证书范围内。
- 不存在的路径返回 404。直接校验 `/404.html` 时应预期 404，并核对错误页内容。
- 图片缓存头及条件请求正常；带哈希 JS/CSS 的长期缓存保持正常。
- 根据应用变更检查浏览器交互，分别注明本地验证和线上验证范围。

验证受环境限制时明确记录限制，不能将其计为通过。脚本不修改 Nginx 配置、域名、证书或 GitHub Pages 发布设置。

## Nginx 配置维护

应用发布只切换站点目录，不覆盖 `/etc/nginx/conf.d/yanxx.conf` 或 `/etc/nginx/conf.d/yanxx-https.conf`。修改 Nginx 时先读取并备份当前配置，在候选配置通过验证后替换、检查并平滑重载；失败时恢复配置备份并再次检查、重载。

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
