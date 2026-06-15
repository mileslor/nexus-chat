import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { Account } from './types';

const getStorePath = () => path.join(app.getPath('userData'), 'accounts.json');

export function loadAccounts(): Account[] {
  try {
    const raw = fs.readFileSync(getStorePath(), 'utf-8');
    return JSON.parse(raw) as Account[];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: Account[]): void {
  fs.writeFileSync(getStorePath(), JSON.stringify(accounts, null, 2), 'utf-8');
}
