export const profile = {
  name: '晏晓翔',
  nameLatin: 'Yan Xiaoxiang',
  email: 's24150812056@smail.cczu.edu.cn',
  github: 'https://github.com/yanxiaoxiang123',
  tagline: 'Wait for A Job',
  statement: '把模型、数据与工程，做成能用的系统。',
  meta: '常州大学 · 计算机硕士 · 2027 届 · 开放实习与校招',
};

/* ---------- 终端开场 ---------- */

export type IntroLine =
  | { type: 'cmd'; text: string }
  | { type: 'output'; prefix: string; text: string }
  | { type: 'gold'; prefix: string; text: string }
  | { type: 'blank' };

export const introLines: IntroLine[] = [
  { type: 'cmd', text: 'whoami' },
  { type: 'output', prefix: '> ', text: '晏晓翔 · Yan Xiaoxiang' },
  { type: 'blank' },
  { type: 'cmd', text: 'cat about.md' },
  { type: 'output', prefix: '> ', text: '把模型、数据与工程，做成能用的系统' },
  { type: 'output', prefix: '  ', text: '全栈 / AI Agent / 时间序列与视觉' },
  { type: 'output', prefix: '  ', text: '常州大学 · 计算机硕士 · 2027 届' },
  { type: 'blank' },
  { type: 'cmd', text: 'echo "Wait for A Job"' },
  { type: 'gold', prefix: '> ', text: 'Wait for A Job' },
  { type: 'blank' },
  { type: 'cmd', text: 'open yanxx-os.app' },
];

export const bootCmd = 'yanxx-os.app';
export const progressBlocks = 12;
export const progressStepMs = 80;

/* ---------- 桌面 ---------- */

export type TabId = 'home' | 'works' | 'about';

export const tabs: { id: TabId; label: string; num: string }[] = [
  { id: 'home', label: '主页', num: '01' },
  { id: 'works', label: '项目', num: '02' },
  { id: 'about', label: '关于', num: '03' },
];

export const desktopMenu = ['主页', '关于', '项目', '做法'];

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  period: string;
  stack: string;
  summary: string;
  points: string[];
  stats: [string, string][];
  accent: 'blue' | 'yellow' | 'red';
  icon: string;
};

export const projects: Project[] = [
  {
    slug: 'backing',
    title: 'Backing',
    subtitle: 'A 股智能投研与量化策略平台',
    role: '全栈开发',
    period: '2026.02 — 至今',
    stack: 'FastAPI · React · LangGraph · DeepSeek · Redis · WebSocket · SSE',
    summary:
      '面向 A 股研究场景，把行情接入、技术选股、策略回测、多 Agent 投研、人工审批与模拟交易串成一条可审计、可恢复的链路。',
    points: [
      '基于 LangGraph 构建多 Agent 智能体，支持流式推理、工具调用、超时取消与结构化研究关联。',
      '17 个量化工具的工具网关，白名单、权限校验、参数验证与调用审计约束 LLM 行为。',
      '13 类量化策略的统一信号与回测框架，适配 A 股 T+1、涨跌停与交易费用规则。',
    ],
    stats: [
      ['17', '工具网关'],
      ['13', '量化策略'],
      ['534', '测试通过'],
    ],
    accent: 'blue',
    icon: '📈',
  },
  {
    slug: 'patent',
    title: 'AI 智能专利辅助审核系统',
    subtitle: '面向专利审查的 AI 辅助平台',
    role: '全栈开发',
    period: '2026.03 — 2026.05',
    stack: 'FastAPI · Vue3 · MySQL · Redis · Ollama · SSE',
    summary:
      '通过多智能体规则引擎调用本地大模型，实现专利文档的结构化分析、合规审查与分类建议，以对话形式实时展示审核过程。',
    points: [
      '审核规则 JSON 配置化，内置 4 套模板，支持规则零代码调整。',
      '令牌认证、Redis 限流、会话吊销与服务故障转移，提升系统稳定性。',
      '前后端分离与双环境部署，Nginx 统一代理，requestAnimationFrame 批量更新流式内容。',
    ],
    stats: [
      ['4', '规则模板'],
      ['3', '端统一'],
      ['20+', '并发会话'],
    ],
    accent: 'yellow',
    icon: '📄',
  },
  {
    slug: 'logistics',
    title: '圆通物流货量预测',
    subtitle: '线路级晚间新增量与全天货量预测',
    role: '算法开发',
    period: '2026.08 — 2026.09',
    stack: 'Python · Pandas · LightGBM · Optuna · Scikit-learn · Parquet',
    summary:
      '基于每日 19 点前累计货量，构建寄件—目的分拨线路级预测系统，完成数据审计、特征工程、训练与效果监控全流程。',
    points: [
      '约 60 项特征 + LightGBM Tweedie 回归预测非负偏态货量。',
      'P10/P50/P90 分位数预测与共形校准，提供不确定性区间。',
      '独立测试线路级 WAPE 7.32%，较星期基线误差降低约 27%。',
    ],
    stats: [
      ['7.32%', '线路 WAPE'],
      ['27%', '误差下降'],
      ['600', '条线路'],
    ],
    accent: 'red',
    icon: '📦',
  },
];

/* ---------- 项目页：Vibe Coding 与 Toolkit ---------- */

export const vibeCards = [
  { emoji: '⌘', title: 'Claude Code', note: 'Agent 结对写代码', x: 4, y: 8, r: -5 },
  { emoji: '✦', title: 'Codex', note: '并行改代码', x: 27, y: 2, r: 3 },
  { emoji: '◎', title: 'LangGraph', note: '多 Agent 编排', x: 48, y: 24, r: -3 },
  { emoji: '⚡', title: 'FastAPI + SSE', note: '流式后端', x: 71, y: 6, r: 4 },
  { emoji: '▤', title: 'Vue3 / React', note: '前端交互', x: 6, y: 56, r: 2 },
  { emoji: '◈', title: 'LightGBM', note: '时序预测', x: 31, y: 62, r: -4 },
  { emoji: '◐', title: 'Qwen2.5-VL', note: '多模态评测', x: 56, y: 56, r: 3 },
  { emoji: '✎', title: 'Optuna', note: '调参与复现', x: 78, y: 48, r: -2 },
];

export const toolkitFolders = [
  {
    title: 'Farther in',
    meta: '拼贴 · 2025',
    top: '7.8%',
    left: '4.8%',
    rot: -10,
    items: [
      { src: '/images/toolkit/farther.webp', label: 'Farther in' },
      { src: '/images/toolkit/pause.webp', label: 'a place to pause' },
    ],
  },
  {
    title: 'Last light',
    meta: '拼贴 · 2025',
    top: '9%',
    left: '64%',
    rot: 11,
    items: [
      { src: '/images/toolkit/last-light.webp', label: 'Last light' },
      { src: '/images/toolkit/looking-up.webp', label: 'looking up' },
    ],
  },
  {
    title: '湖边',
    meta: '照片 · 2025',
    top: '46%',
    left: '44%',
    rot: 2,
    items: [
      { src: '/images/toolkit/lake.webp', label: '湖边' },
      { src: '/images/toolkit/dusk.webp', label: '傍晚' },
    ],
  },
];

/* ---------- GitHub 仓库（桌面图标 + 窗口） ---------- */

export type RepoDetail = {
  name: string;
  icon: string;
  lang: string;
  ext: string;
  stars: number;
  meta: string;
  summary: string;
  stack: string;
  points: string[];
};

export const repoDetails: RepoDetail[] = [
  {
    name: 'dl-reproducibility-skills',
    icon: 'repro',
    lang: 'Python',
    ext: 'MD',
    stars: 3,
    meta: '开源仓库 · Skill 工具包 · v3.3',
    summary:
      '面向 PyTorch / TensorFlow 研究者的深度学习可复现工具包。v3.3 把长教程改成「按需加载 references」的轻量 skill 结构，减少上下文占用。',
    stack: 'Markdown Skill · PyTorch · TensorFlow · CUDA 12.8',
    points: [
      '覆盖种子与确定性、梯度累积、评估 loss、benchmark 吞吐量等复现细节。',
      '按需引用 references，提升 agent 执行稳定性，兼容 Python 3.8+ 与 Windows。',
      'MIT 许可证，附测试过的显卡与框架版本。',
    ],
  },
  {
    name: 'trademarksearch',
    icon: 'trademark',
    lang: 'Jupyter',
    ext: 'IPY',
    stars: 2,
    meta: '开源仓库 · Web 应用',
    summary: '基于 Flask 的商标查询系统，提供商标信息检索、用户管理与管理员后台。',
    stack: 'Flask · SQLite · Jinja2 · HTML/CSS/JS',
    points: [
      '支持多维度商标查询与结果管理。',
      '用户注册登录、权限管理与后台维护。',
      '响应式界面，支持多设备访问。',
    ],
  },
  {
    name: 'yan-skills',
    icon: 'skills',
    lang: 'JavaScript',
    ext: 'JS',
    stars: 1,
    meta: '开源仓库 · Agent 工作流',
    summary:
      '面向 Claude Code 与 OpenCode 的轻量工程技能工作流：默认只在任务明确匹配时加载一个技能，不机械调用。',
    stack: 'JavaScript · Claude Code · OpenCode',
    points: [
      '完整流程从 grilling、specification、planning 到 TDD、独立 review 与验证。',
      'careful 模式对递归删除、强推、清库等危险命令要求单次确认。',
      '支持工作树隔离与 single / adaptive / delegated 三种执行策略。',
    ],
  },
  {
    name: 'ai-stock-analysis',
    icon: 'aistock',
    lang: 'Python',
    ext: 'PY',
    stars: 1,
    meta: '开源仓库 · 数据分析',
    summary: 'A 股数据分析与选股实验：行情整理、技术指标与筛选逻辑的研究脚本。',
    stack: 'Python · Pandas · 行情数据',
    points: ['行情数据获取与清洗。', '技术指标计算与选股实验。', '研究过程与结果留档。'],
  },
  {
    name: 'love_by_code',
    icon: 'love',
    lang: 'TypeScript',
    ext: 'TS',
    stars: 1,
    meta: '开源仓库 · 互动叙事',
    summary: '像素风互动叙事游戏「代码书心意」：四幕故事，从初遇走到告白。',
    stack: 'React 19 · TypeScript · Vite · Tailwind CSS',
    points: [
      '四幕主题关卡，收集角色、与物体互动推进剧情。',
      '像素美术与对话叙事。',
      '基于 Vite 的轻量构建。',
    ],
  },
  {
    name: 'todo-app',
    icon: 'todo',
    lang: 'TypeScript',
    ext: 'TS',
    stars: 1,
    meta: '开源仓库 · 桌面应用',
    summary: '一个「凭感觉写」的 Todo 应用，用 Tauri 打包成桌面端，功能完整、随手可用。',
    stack: 'React 18 · TypeScript · Tauri 2.0 · Zustand · Tailwind · shadcn/ui',
    points: [
      'Tauri 2.0 桌面壳 + React 18 前端。',
      'Zustand 状态管理与 shadcn/ui 组件。',
      'Vite 构建、Tailwind 样式。',
    ],
  },
  {
    name: 'StockLSTM_FinanceLlama',
    icon: 'stocklstm',
    lang: 'Python',
    ext: 'PY',
    stars: 0,
    meta: '开源仓库 · 金融时序',
    summary: 'Qwen-LSTM 混合模型在金融序列上的实现：训练、评估、回测与预测。',
    stack: 'Python · PyTorch · LSTM · FinanceLlama',
    points: [
      '模块化的数据、模型、训练与评估脚本。',
      '回测策略与风险指标。',
      '未来预测入口与快速导入测试。',
    ],
  },
  {
    name: 'clawd-mochi-pet',
    icon: 'pet',
    lang: 'C',
    ext: 'C',
    stars: 0,
    meta: '开源仓库 · 硬件',
    summary:
      '基于 ESP32-C3 的桌面小宠物（fork 自 Clawd Mochi），把网页控制器换成会自己活动、有情绪的宠物。',
    stack: 'C · ESP32-C3 · 1.54" TFT',
    points: [
      '1.54 寸彩色屏上跑自主动画与情绪变化。',
      '约 6–8 美元、1 小时可完成的入门硬件项目。',
      '附 3D 打印外壳，独立同人项目。',
    ],
  },
  {
    name: 'campusshop-yanxiaoxiang123',
    icon: 'shop',
    lang: 'Java',
    ext: 'JAVA',
    stars: 0,
    meta: '课程项目 · 测试教学',
    summary:
      '「AI 辅助软件测试」课程的教学项目：一个故意留有缺陷的校园商城，提供 C# 与 Java 两套等价实现。',
    stack: 'Java · Spring Boot · C# .NET 10 · xUnit',
    points: [
      '计价、优惠券、下单、登录等业务模块。',
      'C#（.NET 10）与 Java（JDK 21 + Spring Boot）双版本。',
      '配套需求文档与单元测试，用来练习找缺陷。',
    ],
  },
  {
    name: 'daily-stock-analysis',
    icon: 'daily',
    lang: '—',
    ext: 'MD',
    stars: 0,
    meta: '个人脚本 · 日常复盘',
    summary: '每天记录行情并做简单复盘的个人脚本集合。',
    stack: '脚本 · 行情数据',
    points: ['抓取当日行情数据。', '整理成可回顾的每日记录。'],
  },
  {
    name: 'yanxx-portfolio',
    icon: 'portfolio',
    lang: 'TypeScript',
    ext: 'TS',
    stars: 0,
    meta: '上一版主页 · Next.js 静态站',
    summary:
      '上一版中英双语个人主页：纸飞机滚动的视觉概念，包含项目案例与研究代码入口。',
    stack: 'Next.js 16 · React · TypeScript · GSAP',
    points: [
      '中英显式路由与静态导出。',
      'GSAP 滚动动效与项目详情页。',
      '无后端、数据库或运行时密钥。',
    ],
  },
];

export const research = [
  {
    title: '钻井轨迹预测',
    text: '结合语言模型语义与 LSTM 的时序预测实验，公开部分实现与复现说明。',
    url: 'https://github.com/yanxiaoxiang123/Qwen-LSTM-Drilling-Trajectory',
  },
  {
    title: '心电研究归档',
    text: '历史实验与训练评估入口；公开样本用于流程演示，不代表临床验证。',
    url: 'https://github.com/yanxiaoxiang123/ecg-pvc-research-archive',
  },
];

/* ---------- 关于页（原主页内容） ---------- */

export const about = {
  intro: {
    label: '介绍',
    heading: '用 AI 赋能工程',
    body: '常州大学计算机硕士在读，探索数据、算法与可用的系统。从模型实验到完整应用，我习惯和 Agent 搭档，把想法放进真实的问题里。',
  },
  values: {
    label: '个人优势',
    heading: '一个人，也能当一支团队',
    items: [
      {
        title: '全栈交付',
        text: '从需求、架构到开发、部署、运维，能独立走完全流程，有过主导多款系统落地的经验。',
      },
      {
        title: '模型实践',
        text: '时间序列、计算机视觉与 LLM 微调，用数据与评测把模型效果讲清楚。',
      },
      {
        title: 'Agent 协作',
        text: '熟练使用 Claude Code、Codex 等工具，把代码理解、修改与开发串成可复用的工作流。',
      },
    ],
  },
  timeline: {
    label: '经历',
    heading: '从数据到系统',
    items: [
      {
        date: '2020.09',
        title: '数据科学与大数据技术 · 本科',
        place: '常州大学',
        text: '从数据分析出发，逐步走向模型与系统实践。',
      },
      {
        date: '2024.09',
        title: '计算机科学与技术 · 硕士',
        place: '常州大学',
        text: '关注时间序列与计算机视觉，预计 2027 年毕业。',
      },
      {
        date: '2026.07',
        title: '多模态算法与数据工程 · 实习',
        place: '北京玛达科技',
        text: '视频元数据处理、抽取流水线与模型评测工具链。',
      },
    ],
  },
  now: {
    label: '现在',
    heading: '正在发生',
    items: [
      { title: 'Backing · A 股智能投研平台', sub: '全栈开发 · 2026.02 — 至今' },
      { title: '求职中', sub: '2027 届 · 开放实习与校招' },
      { title: '研究 · 时间序列与计算机视觉', sub: '硕士方向' },
    ],
    todo: '把下一个想法做成能用的系统。',
  },
};

/* ---------- 联系 ---------- */

export const contactInfo = {
  quote: '把想法，做成能用的东西。',
  email: profile.email,
  github: profile.github,
};

/* ---------- 告别终端 ---------- */

export const goodbye: {
  lines: { cmd: string; out: string; gold?: boolean }[];
  footer: string;
  back: string;
} = {
  lines: [
    { cmd: 'echo "see you"', out: 'See you next time.' },
    { cmd: 'cat contact.md', out: 's24150812056@smail.cczu.edu.cn' },
    { cmd: 'fortune', out: '“把想法，做成能用的东西。” — 晏晓翔' },
    { cmd: 'exit', out: 'Process completed', gold: true },
  ],
  footer: '© 2026 晏晓翔 · Built with AI',
  back: '回到开始 · Back to Start',
};
