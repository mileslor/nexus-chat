import { app, screen } from 'electron';
import fs from 'fs';
import path from 'path';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

const defaults: WindowState = { width: 1200, height: 800 };
const storePath = () => path.join(app.getPath('userData'), 'window-state.json');

export function loadWindowState(): WindowState {
  try {
    const state = JSON.parse(fs.readFileSync(storePath(), 'utf-8')) as WindowState;
    // Validate the window is still visible on a connected screen
    if (state.x !== undefined && state.y !== undefined) {
      const displays = screen.getAllDisplays();
      const visible = displays.some((d) => {
        const { x, y, width, height } = d.bounds;
        return (
          state.x! >= x &&
          state.y! >= y &&
          state.x! < x + width &&
          state.y! < y + height
        );
      });
      if (!visible) return defaults;
    }
    return { ...defaults, ...state };
  } catch {
    return defaults;
  }
}

export function saveWindowState(state: WindowState): void {
  try {
    fs.writeFileSync(storePath(), JSON.stringify(state, null, 2), 'utf-8');
  } catch {}
}
