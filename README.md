# yanxx — Wait for A Job

晏晓翔的个人主页：一个「桌面 OS + 终端」风格的作品集，介绍经历、项目与研究。

设计语言参照 [hiesther.me](https://hiesther.me/) —— 奶油纸色、终端蓝、便签黄，Fraunces + 思源宋体 + Caveat + Fira Code。

## 结构

单页应用，三个页签（底部胶囊导航切换）：

| 页签 | 内容 |
| --- | --- |
| 主页 | 终端开场（`open yanxx-os.app` + 进度条）→ 自动缩放进入蓝色桌面 → 向下滚动，屏幕缩回笔记本并浮出告别终端 |
| 项目 | 三个精选项目的完整卡片 |
| 关于 | 介绍 / 优势 / 经历 / 实践 / 现在 |

桌面：图标全部在右侧，文件、文件夹、应用可以同时打开多个窗口；星星常驻闪烁，点击桌面会爆星星，贴纸可拖动。

## 本地开发

```bash
npm ci
```

```bash
npm run dev
```

打开 http://localhost:3000 。

## 构建静态站点

```bash
npm run build
```

产物在 `out/`，可直接部署到任意静态主机。

## 检查

```bash
npm run lint
```

```bash
npm run typecheck
```

## 内容维护

- 全部文案、项目、经历在 `src/data/content.ts`。
- 桌面伙伴「小镜」的 9 个动作在 `public/images/xiaojing/*.webp`，由 `docs/xiaojing-pencil/gifs/` 的 GIF 转码而来（透明、循环、单帧约 120–210KB）。
- 字体通过 Google Fonts CDN 加载，不打包字体文件。

## 部署

- **GitHub Pages**：推送到 `main` 后由 `.github/workflows/deploy.yml` 自动构建并发布。
- **自有服务器**：见 `docs/DEPLOY.md` 与 `scripts/deploy.sh`。

联系：s24150812056@smail.cczu.edu.cn · [GitHub](https://github.com/yanxiaoxiang123)
