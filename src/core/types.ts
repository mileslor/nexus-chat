export type PlatformId = 'whatsapp' | 'telegram' | 'facebook';

export interface Account {
  id: string;
  platformId: PlatformId;
  label: string;
  color: string;
  sessionPartition: string;
  createdAt: number;
}

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  url: string;
  icon: string;
  colors: string[];
  userAgent?: string;
  preloadScript?: string;
}

export interface SessionState {
  accountId: string;
  status: 'connecting' | 'active' | 'disconnected' | 'needs-login';
  unreadCount: number;
  title: string;
  favicon?: string;
}

export interface IpcChannels {
  // renderer → main
  'session:create': { account: Account };
  'session:remove': { accountId: string };
  'session:focus': { accountId: string };
  'accounts:load': void;
  // main → renderer
  'session:state-changed': SessionState;
  'accounts:list': Account[];
}
