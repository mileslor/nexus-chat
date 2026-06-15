import {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  Notification,
  Tray,
  Menu,
  session,
} from 'electron';
import path from 'path';
import { loadAccounts, saveAccounts } from '../core/account-store';
import { getPlatform } from '../core/platforms';
import { loadWindowState, saveWindowState } from './window-state';
import { loadSettings, saveSettings, applySettings } from './settings';
import { createTrayIcon } from './icon';
import { initAutoUpdate } from './updater';
import type { Account, SessionState } from '../core/types';
import type { AppSettings } from './settings';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

const SIDEBAR_WIDTH = 72;
const RECONNECT_DELAYS = [3000, 5000, 10000, 30000, 60000];

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let currentSettings: AppSettings = loadSettings();

const accounts: Account[] = [];
const views = new Map<string, WebContentsView>();
const unreadCounts = new Map<string, number>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const reconnectAttempts = new Map<string, number>();
let activeAccountId: string | null = null;

function broadcastState(state: SessionState) {
  mainWindow?.webContents.send('session:state-changed', state);
}

function getViewBounds(win: BrowserWindow) {
  const { width, height } = win.getContentBounds();
  return { x: SIDEBAR_WIDTH, y: 0, width: width - SIDEBAR_WIDTH, height };
}

function scheduleReconnect(account: Account) {
  const attempts = reconnectAttempts.get(account.id) ?? 0;
  if (attempts >= RECONNECT_DELAYS.length) return;

  const delay = RECONNECT_DELAYS[attempts];
  reconnectAttempts.set(account.id, attempts + 1);

  const timer = setTimeout(() => {
    reconnectTimers.delete(account.id);
    const view = views.get(account.id);
    if (!view) return;
    const platform = getPlatform(account.platformId);
    view.webContents.loadURL(platform.url);
    broadcastState({
      accountId: account.id,
      status: 'connecting',
      unreadCount: unreadCounts.get(account.id) ?? 0,
      title: `${platform.name} — Reconnecting…`,
    });
  }, delay);

  reconnectTimers.set(account.id, timer);
}

function createView(account: Account): WebContentsView {
  const platform = getPlatform(account.platformId);
  const partition = `persist:${account.sessionPartition}`;

  const ses = session.fromPartition(partition);
  if (platform.userAgent) ses.setUserAgent(platform.userAgent);

  ses.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = ['notifications', 'media'];
    callback(allowed.includes(permission));
  });

  const webviewPreloadPath = path.join(__dirname, 'webview.js');

  const view = new WebContentsView({
    webPreferences: {
      partition,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // required for preload injection
      preload: webviewPreloadPath,
    },
  });

  view.webContents.loadURL(platform.url);

  view.webContents.on('page-title-updated', (_e, title) => {
    const unreadMatch = title.match(/^\((\d+)\)/);
    const unread = unreadMatch ? parseInt(unreadMatch[1]) : 0;
    unreadCounts.set(account.id, unread);
    updateTrayBadge();
    broadcastState({
      accountId: account.id,
      status: 'active',
      unreadCount: unread,
      title: title.replace(/^\(\d+\)\s*/, ''),
    });
  });

  view.webContents.on('did-navigate', () => {
    reconnectAttempts.delete(account.id);
    const timer = reconnectTimers.get(account.id);
    if (timer) {
      clearTimeout(timer);
      reconnectTimers.delete(account.id);
    }
    broadcastState({
      accountId: account.id,
      status: 'active',
      unreadCount: unreadCounts.get(account.id) ?? 0,
      title: platform.name,
    });
  });

  view.webContents.on('did-fail-load', (_e, code) => {
    if (code === -3) return; // Aborted / user navigated away
    broadcastState({
      accountId: account.id,
      status: 'disconnected',
      unreadCount: unreadCounts.get(account.id) ?? 0,
      title: `${platform.name} — Disconnected`,
    });
    scheduleReconnect(account);
  });

  // Show Electron-level notification when account is not focused
  view.webContents.on('did-finish-load', () => {
    if (!currentSettings.showNotifications) return;
    // Inject unread change watcher after page loads
    view.webContents.executeJavaScript(`
      (function() {
        if (window.__nexusNotifPatched) return;
        window.__nexusNotifPatched = true;
        const OriginalNotif = window.Notification;
        function PatchedNotif(title, opts) {
          const n = new OriginalNotif(title, opts);
          return n;
        }
        PatchedNotif.prototype = OriginalNotif.prototype;
        PatchedNotif.permission = OriginalNotif.permission;
        PatchedNotif.requestPermission = OriginalNotif.requestPermission.bind(OriginalNotif);
        try { Object.defineProperty(window, 'Notification', { value: PatchedNotif }); } catch(e) {}
      })();
    `).catch(() => {});
  });

  return view;
}

function destroyView(accountId: string) {
  const timer = reconnectTimers.get(accountId);
  if (timer) clearTimeout(timer);
  reconnectTimers.delete(accountId);
  reconnectAttempts.delete(accountId);

  const view = views.get(accountId);
  if (!view) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.contentView.removeChildView(view);
  }
  view.webContents.close();
  views.delete(accountId);
  unreadCounts.delete(accountId);
}

function focusAccount(accountId: string) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const view = views.get(accountId);
  if (!view) return;

  if (activeAccountId && activeAccountId !== accountId) {
    const oldView = views.get(activeAccountId);
    if (oldView && mainWindow.contentView.children.includes(oldView)) {
      mainWindow.contentView.removeChildView(oldView);
    }
  }

  if (!mainWindow.contentView.children.includes(view)) {
    mainWindow.contentView.addChildView(view);
  }
  view.setBounds(getViewBounds(mainWindow));
  activeAccountId = accountId;
}

function updateTrayBadge() {
  const total = Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0);
  tray?.setToolTip(total > 0 ? `NexusChat (${total} unread)` : 'NexusChat');
  if (process.platform === 'darwin') {
    app.setBadgeCount(total);
  }
}

function persistWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const isMaximized = mainWindow.isMaximized();
  const bounds = mainWindow.getBounds();
  saveWindowState({ ...bounds, isMaximized });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('NexusChat');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show NexusChat', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
  tray.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    ...state,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 20 },
    backgroundColor: '#0f0f1a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (state.isMaximized) mainWindow.maximize();

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)  // .vite/renderer/<name>/index.html
    );
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.on('resize', () => {
    if (!mainWindow || !activeAccountId) return;
    views.get(activeAccountId)?.setBounds(getViewBounds(mainWindow));
  });

  // Save state on resize/move with debounce
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const debounceSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persistWindowState, 500);
  };
  mainWindow.on('resize', debounceSave);
  mainWindow.on('move', debounceSave);

  mainWindow.on('close', (e) => {
    persistWindowState();
    e.preventDefault();
    mainWindow?.hide();
  });
}

// IPC handlers
ipcMain.handle('accounts:load', () => {
  const saved = loadAccounts();
  accounts.length = 0;
  accounts.push(...saved);
  for (const acc of accounts) {
    if (!views.has(acc.id)) views.set(acc.id, createView(acc));
  }
  if (accounts.length > 0 && !activeAccountId) focusAccount(accounts[0].id);
  return accounts;
});

ipcMain.handle('session:create', (_e, account: Account) => {
  if (!account?.id || !account?.platformId) return;
  accounts.push(account);
  saveAccounts(accounts);
  views.set(account.id, createView(account));
  focusAccount(account.id);
});

ipcMain.handle('session:remove', (_e, accountId: string) => {
  const idx = accounts.findIndex((a) => a.id === accountId);
  if (idx !== -1) accounts.splice(idx, 1);
  saveAccounts(accounts);
  destroyView(accountId);
  if (activeAccountId === accountId) {
    activeAccountId = null;
    if (accounts.length > 0) focusAccount(accounts[0].id);
  }
});

ipcMain.on('session:focus', (_e, accountId: string) => focusAccount(accountId));

ipcMain.on('modal:state', (_e, isOpen: boolean) => {
  if (!mainWindow || mainWindow.isDestroyed() || !activeAccountId) return;
  const view = views.get(activeAccountId);
  if (!view) return;
  if (isOpen) {
    view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  } else {
    view.setBounds(getViewBounds(mainWindow));
  }
});

ipcMain.handle('settings:load', () => currentSettings);

ipcMain.handle('settings:save', (_e, settings: AppSettings) => {
  currentSettings = settings;
  saveSettings(settings);
  applySettings(settings);
});

app.whenReady().then(() => {
  initAutoUpdate();
  currentSettings = loadSettings();
  // Ensure launch-at-login is always on unless user explicitly disabled it
  if (currentSettings.launchAtLogin) {
    app.setLoginItemSettings({ openAtLogin: true });
  }
  applySettings(currentSettings);
  createTray();
  createWindow();
  app.on('activate', () => { mainWindow?.show(); mainWindow?.focus(); });
});

app.on('window-all-closed', () => {
  // Keep alive in tray on all platforms
});

app.on('before-quit', () => {
  persistWindowState();
  mainWindow?.removeAllListeners('close');
  for (const id of [...views.keys()]) destroyView(id);
});
