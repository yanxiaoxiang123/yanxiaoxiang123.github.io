import type { ReactNode } from 'react';

export type WinId = 'about' | 'journey' | 'projects' | 'research' | 'sayhi'
  | 'backing' | 'patent' | 'logistics' | 'repo';
export type DesktopContent = Record<string, ReactNode>;
export type RepositoryIcon = { name: string; icon: string };
