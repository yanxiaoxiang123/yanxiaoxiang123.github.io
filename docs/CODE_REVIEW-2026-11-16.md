# 全量代码审查记录 · 2026-11-16

本次按当前代码全文审查，不以 Git 变更行为边界。基准提交为 `950c7a2`，审查及修复位于分支 `claude/gracious-jang-d90f7e` 的工作区。使用 OpenCodeReview 的审查规则，并对确定且可安全修复的问题进行了本地修复。

保留的问题共 9 项：初次审查修复了 8 项 Medium；随后按用户要求补充实现了 High 部署问题的本地代码修复及失败恢复测试。未提交、推送或部署这些修改，也未连接生产服务器。

## 高风险部署问题的修复

**High（已修复，本地验证）：部署脚本直接同步正式目录，传输中断或并发发布可能破坏线上版本。**

原实现通过 `rsync --delete` 逐文件写入正式目录。现由 [deploy.sh](../scripts/deploy.sh) 制作静态产物快照、归档及逐文件校验清单，并通过单次 SSH 会话执行 [deploy-remote.sh](../scripts/deploy-remote.sh)。远端以原子创建锁目录实现互斥，上传和校验只操作独立目录，校验归档 SHA-256、文件数量和逐文件 SHA-256 后才切换正式目录；旧站点及失败产物分别保留。

脚本还保留旧哈希资源，切换后重载 Nginx，并核对首页 HTTP 200 和响应内容哈希。目录移动、重载、HTTP 校验或可捕获信号导致失败时恢复旧站点；恢复时保留已暴露的新版本哈希资源，旧版本同名文件优先。恢复失败则保留锁和备份，阻止后续发布。最终 28 个部署专项测试全部通过；最初修复前观察到 13 个相关用例失败，其中上传中断会实际改变旧首页。

后续独立复核提出的五个边界也已补充复现并修复：

| 边界 | 修复与验证 |
| --- | --- |
| 恢复时再次收到终止信号 | 恢复期间忽略 HUP、INT、TERM；在移动失败版本后连续发出信号，旧首页及资源仍恢复，锁正常释放。 |
| 创建锁后、登记归属前收到信号 | 先安装清理 trap，在取得锁的临界区延后信号处理，登记归属后再退出；测试不再遗留无主锁，也不会移除既有锁。 |
| 回滚使已暴露的新哈希资源失效 | 共用双向资源保留逻辑；回滚后新版本独有 chunk 仍可从正式目录读取，旧版本同名 chunk 不被替换。 |
| 路径中的方括号被当作通配符 | 在产物目录中检查相对 JS 模式；目标路径和本地临时路径包含方括号的发布均通过。 |
| 并行构建与快照混用不同构建内容 | 新增 [build.mjs](../scripts/build.mjs)，`npm run build` 与部署快照共用本地锁；构建失败或未完成时拒绝复用导出。测试覆盖双向互斥、默认部署内的构建、失败后重建，以及上传期间新构建不会改变已打包内容。 |

上述缺陷回归在补强前实际失败；其中重复信号导致正式首页缺失，失败构建的残留首页也曾被测试发布。修复后针对性测试及完整套件均通过。

部署测试执行真实的本地解包、哈希校验、文件复制和目录重命名，替代 SSH 连接和系统服务调用，不连接服务器。两次重命名有短暂窗口；断电或 SIGKILL 仍需依据保留的锁及发布记录人工核实恢复，不能承诺零停机或线上环境已验证。参数、权限和恢复边界见 [DEPLOY.md](DEPLOY.md)。

## 已修复的问题

| 严重程度 | 问题与触发场景 | 修复及证据 |
| --- | --- | --- |
| Medium | `SKIP_BUILD=1` 复用空的或不完整的 `out/` 时仍可进入带删除操作的同步。 | [deploy.sh](../scripts/deploy.sh) 要求非空首页和 JS chunk 存在；两个回归用例确认不合格产物在联系服务器前退出。随后部署事务增加了快照、归档及逐文件哈希校验。 |
| Medium | 清理上一版本的哈希资源后，已打开的旧页面请求延迟模块会失败。 | 初次修复增加了 rsync 接收端保护；随后改为在 [deploy-remote.sh](../scripts/deploy-remote.sh) 中复制并核对新版本缺少的旧哈希资源。测试检查旧资源仍可从正式目录读取，且新版本同名文件不被覆盖。 |
| Medium | `DEPLOY_KEY` 包含空格或单引号时，rsync 使用的 SSH 命令会拆错密钥参数。 | 后续实现不再依赖 rsync；[deploy.sh](../scripts/deploy.sh) 使用 SSH 参数数组并引用远程程序及参数。含空格和单引号的密钥、目标路径已通过执行测试。 |
| Medium | `next start` 与项目的 `output: 'export'` 不兼容。 | 从 [package.json](../package.json) 移除不适用的启动脚本；[README.md](../README.md) 给出静态产物的本地预览方式，生产静态预览已实际运行。 |
| Medium | 抠图脚本将 RGBA 转为 RGB，丢失输入透明度，影响透明背景、连通区域和裁剪。 | [key-green.py:14](../scripts/key-green.py:14) 保留 RGBA，并在连通区域筛选后合并原始 alpha；透明背景、半透明前景与 RGB 输入的 3 个测试通过。 |
| Medium | 窗口或图标拖到宽屏右侧后缩小视口，已提交坐标可能仍在屏幕外。 | [useTransformDrag.ts:96](../src/hooks/useTransformDrag.ts:96) 在布局更新后重新约束坐标；[DesktopIcon.tsx:24](../src/components/DesktopIcon.tsx:24) 使用元素实际尺寸。生产页面从 1440px 缩到 375px 后，窗口横向范围为 22–367px，图标为 315–375px。 |
| Medium | 告别页仅设 `opacity: 0`，看不见的联系链接和重启按钮仍可获得焦点。 | [globals.css:1233](../src/app/globals.css:1233) 配合显示状态控制 `visibility`，同时保留非动画布局的可见性。生产页面隐藏阶段无法聚焦链接或重启按钮，显示阶段联系链接可聚焦。 |
| Medium | 聚焦“关于”页屏幕外的卡片按钮会使 sticky 容器内部滚动，完整阅读入口被移出视口。 | [globals.css:2073](../src/app/globals.css:2073) 改用 `overflow: clip`；[AboutFlight.tsx:229](../src/components/AboutFlight.tsx:229) 将屏幕外卡片设为 inert，并在普通布局中清除。桌面验证内部 scrollTop 保持 0，阅读入口 top 为 24px；手机布局五张卡片均恢复可交互。 |

## 验证结果与边界

| 检查 | 结果 |
| --- | --- |
| `npm test` | 最终完整套件 58/58 通过，0 失败；其中部署专项 28 项。 |
| `python -I tests/test_key_green.py` | 3/3 通过。 |
| `npm run lint` | 通过。 |
| `npm run typecheck` | 通过。 |
| `bash -n scripts/deploy.sh scripts/deploy-remote.sh` | 通过。 |
| `node --check scripts/build.mjs` | 通过。 |
| `git --no-pager diff --check` | 通过。 |
| `npm run build` | 退出码 0，Next.js 16.4.6 完成生产静态导出。 |
| `npm audit --omit=dev --json` | 生产依赖安全公告为 0；此结论不涵盖开发依赖。 |
| 生产导出页面浏览器回归 | 完整阅读对话框及“现在”章节、桌面卡片焦点、手机阅读布局、窗口和图标缩放、告别页隐藏/显示焦点均通过。 |
| 浏览器错误与资源请求 | 本轮静态预览没有控制台错误或失败请求。 |

部署与抠图缺陷回归均观察过修复前失败、修复后通过。部署测试替代 SSH、依赖安装和 Nginx、systemd、HTTP 服务边界；文件工具仅在选定故障点注入失败，正常操作执行真实归档、哈希、复制、锁目录和重命名。本地构建互斥测试执行实际 npm 入口和构建包装器，以受控的 Next CLI 替代耗时构建；另单独完成了真实 `npm run build`，检查导出首页非空、构建状态为 `ready`、本地锁已释放。测试未连接服务器，不能替代真实服务或线上发布验证。

最终部署补强后，重新运行了完整 Node/Python 测试、lint、类型检查、真实生产构建、Bash/Node 语法检查和差异检查。安全公告与 UI 验证来自初次审查；后续仅修改部署工具，未修改应用代码或重新启动预览。UI 验证针对本地 `out/` 的生产静态页面，测试视口包括 1440×900 与 375×812，结束时已清除视口模拟。

Node 测试仍有既存的 `MODULE_TYPELESS_PACKAGE_JSON` 提示；不影响测试通过，未将输出描述为完全无警告。

## 文件覆盖记录

初始审查范围包括 44 个已跟踪的代码、配置、脚本及测试文件：

- `total_files = 44`
- `reviewed_files = 44`
- `skipped_files = 0`
- `coverage_rate = 100%`

这里的覆盖率表示审查清单的文件覆盖率，不是测试覆盖率，也不表示不存在其他缺陷。CodeGraph 索引只覆盖其中 8 个文件，其他已明确定位的文件直接读取补齐。二进制资产不作为源代码审查；文档、`package-lock.json` 的清单一致性及本地预览配置作为补充上下文检查，未对生成的 lockfile 逐行做人工审查。

| 路径 | 状态 |
| --- | --- |
| `.github/workflows/deploy.yml` | reviewed |
| `eslint.config.mjs` | reviewed |
| `next-env.d.ts` | reviewed |
| `next.config.ts` | reviewed |
| `ops/nginx/images-cache.conf` | reviewed |
| `package.json` | reviewed |
| `scripts/deploy.sh` | reviewed |
| `scripts/key-green.py` | reviewed |
| `tsconfig.json` | reviewed |
| `src/app/globals.css` | reviewed |
| `src/app/layout.tsx` | reviewed |
| `src/app/page.tsx` | reviewed |
| `src/components/About.tsx` | reviewed |
| `src/components/AboutFlight.tsx` | reviewed |
| `src/components/DesktopContent.tsx` | reviewed |
| `src/components/DesktopIcon.tsx` | reviewed |
| `src/components/DesktopOS.tsx` | reviewed |
| `src/components/DesktopWindow.tsx` | reviewed |
| `src/components/ExitContent.tsx` | reviewed |
| `src/components/ExitSection.tsx` | reviewed |
| `src/components/PageActivity.tsx` | reviewed |
| `src/components/Portfolio.tsx` | reviewed |
| `src/components/Sticker.tsx` | reviewed |
| `src/components/Terminal.tsx` | reviewed |
| `src/components/Works.tsx` | reviewed |
| `src/components/Xiaojing.tsx` | reviewed |
| `src/data/content.ts` | reviewed |
| `src/data/intro.ts` | reviewed |
| `src/data/navigation.ts` | reviewed |
| `src/hooks/usePausableTimeout.ts` | reviewed |
| `src/hooks/usePortfolioLifecycle.ts` | reviewed |
| `src/hooks/useTransformDrag.ts` | reviewed |
| `src/lib/desktop-content.ts` | reviewed |
| `src/lib/frame-position.ts` | reviewed |
| `src/lib/motion-hint.ts` | reviewed |
| `src/lib/pausable-timeout.ts` | reviewed |
| `src/lib/pet-assets.ts` | reviewed |
| `src/lib/portfolio-state.ts` | reviewed |
| `tests/component-boundaries.test.mjs` | reviewed |
| `tests/frame-position.test.mjs` | reviewed |
| `tests/motion-hint.test.mjs` | reviewed |
| `tests/pausable-timeout.test.mjs` | reviewed |
| `tests/pet-assets.test.mjs` | reviewed |
| `tests/portfolio-state.test.mjs` | reviewed |

初次修复中新增的两个测试文件也已补充审查并运行：

| 路径 | 状态 |
| --- | --- |
| `tests/deploy.test.mjs` | reviewed |
| `tests/test_key_green.py` | reviewed |

计入这两个新增测试文件后，初次审查的代码及配置文件共 46 个，未跳过条目。后续部署修复另检查了 `scripts/deploy-remote.sh`、`scripts/build.mjs`、`.gitattributes` 和 `.gitignore`，并复查 `scripts/deploy.sh`、`package.json` 与部署测试：远端事务及构建包装器通过执行测试和语法检查，真实生产导出通过；`git check-attr` 确认两个部署脚本均强制使用 LF 换行，本地锁和状态已排除在 Git 之外。
