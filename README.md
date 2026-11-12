# yanxx — 1 person + AI = 1 team

晏晓翔的个人主页：一个「桌面 OS + 终端」风格的作品集，介绍经历、项目与研究。

设计语言参照 [hiesther.me](https://hiesther.me/) —— 奶油纸色、终端蓝、便签黄，Fraunces + 思源宋体 + Caveat + Fira Code。

## 结构

单页应用，三个页签（底部胶囊导航切换）：

| 页签 | 内容 |
| --- | --- |
| 主页 | 终端开场 → 介绍 / 优势 / 经历 / 实践 / 现在 → 告别终端 |
| 我的OS | 蓝色桌面：可拖动窗口（关于我、经历、项目、研究、Say Hi）、贴纸、点击星星 |
| 项目 | 三个精选项目的完整卡片 |

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
- 贴纸插画在 `public/images/sticker.png`（Magpie 生成，已抠图）。
- 字体通过 Google Fonts CDN 加载，不打包字体文件。

## 部署

- **GitHub Pages**：推送到 `main` 后由 `.github/workflows/deploy.yml` 自动构建并发布。
- **自有服务器**：见 `docs/DEPLOY.md` 与 `scripts/deploy.sh`。

联系：s24150812056@smail.cczu.edu.cn · [GitHub](https://github.com/yanxiaoxiang123)
