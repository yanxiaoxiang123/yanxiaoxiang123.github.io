export type TabId = 'home' | 'works' | 'about';

export const tabs: { id: TabId; label: string; num: string }[] = [
  { id: 'home', label: '主页', num: '01' },
  { id: 'works', label: '项目', num: '02' },
  { id: 'about', label: '关于', num: '03' },
];

export const desktopMenu = ['主页', '关于', '项目', '做法'];
