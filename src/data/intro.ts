export type IntroLine =
  | { type: 'cmd'; text: string }
  | { type: 'output'; prefix: string; text: string }
  | { type: 'gold'; prefix: string; text: string }
  | { type: 'blank' };

// The typewriter needs these short lines in the browser. Long-form copy stays server-side.
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
