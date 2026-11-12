export const profile = {
  name: '晏晓翔',
  nameLatin: 'Yan Xiaoxiang',
  email: 's24150812056@smail.cczu.edu.cn',
  github: 'https://github.com/yanxiaoxiang123',
  tagline: '1 person + AI = 1 team',
  statement: '把模型、数据与工程，做成能用的系统。',
  meta: '常州大学 · 计算机硕士 · 2027 届 · 开放实习与校招',
};

export type TermLine =
  | { kind: 'prompt'; cmd: string }
  | { kind: 'output'; text: string }
  | { kind: 'gold'; text: string };

export const terminalLines: TermLine[] = [
  { kind: 'prompt', cmd: 'whoami' },
  { kind: 'output', text: '晏晓翔 · Yan Xiaoxiang' },
  { kind: 'prompt', cmd: 'cat tagline.txt' },
  { kind: 'gold', text: '1 person + AI = 1 team' },
  { kind: 'output', text: '把模型、数据与工程，做成能用的系统。' },
  { kind: 'output', text: '常州大学 · 计算机硕士 · 2027 届 · 开放实习与校招' },
  { kind: 'prompt', cmd: 'ls ~/projects' },
  { kind: 'output', text: 'backing/   patent-review/   logistics-forecast/' },
];

export type TabId = 'home' | 'os' | 'works';

export const tabs: { id: TabId; label: string; num: string }[] = [
  { id: 'home', label: '主页', num: '01' },
  { id: 'os', label: '我的OS', num: '02' },
  { id: 'works', label: '项目', num: '03' },
];

export const home = {
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

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  period: string;
  stack: string;
  summary: string;
  points: string[];
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
    accent: 'red',
    icon: '📦',
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

export const contact = {
  windowTitle: 'Say Hi',
  heading: '聊聊新的可能',
  body: '关于项目、研究或工作机会，欢迎写信，或到 GitHub 找我。',
  email: 's24150812056@smail.cczu.edu.cn',
  github: 'https://github.com/yanxiaoxiang123',
  quote: '把想法，做成能用的东西。',
  signoff: '晏晓翔 · Built with AI',
  backToTop: '回到开始 · Back to Start',
};
