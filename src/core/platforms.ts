import type { PlatformConfig, PlatformId } from './types';
import whatsapp from '../../platforms/whatsapp/config';
import telegram from '../../platforms/telegram/config';
import facebook from '../../platforms/facebook/config';

const registry: Record<PlatformId, PlatformConfig> = {
  whatsapp,
  telegram,
  facebook,
};

export function getPlatform(id: PlatformId): PlatformConfig {
  return registry[id];
}

export function getAllPlatforms(): PlatformConfig[] {
  return Object.values(registry);
}

export { registry };
