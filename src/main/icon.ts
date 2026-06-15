import { nativeImage } from 'electron';
import type { NativeImage } from 'electron';

export function createTrayIcon(): NativeImage {
  const size = 22;
  const buffer = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 1;
  const inner = size / 2 - 4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= outer && dist > inner) {
        // Ring shape — template image (black)
        buffer[i] = 0;
        buffer[i + 1] = 0;
        buffer[i + 2] = 0;
        buffer[i + 3] = 220;
      } else if (dist <= inner - 1) {
        // Inner dot
        buffer[i] = 0;
        buffer[i + 1] = 0;
        buffer[i + 2] = 0;
        buffer[i + 3] = 220;
      } else {
        buffer[i + 3] = 0; // transparent
      }
    }
  }

  const img = nativeImage.createFromBuffer(buffer, { width: size, height: size });
  img.setTemplateImage(true); // macOS: let system handle light/dark mode
  return img;
}

export function createAppIcon(): NativeImage {
  const size = 512;
  const buffer = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 20;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) {
        buffer[i] = 99;
        buffer[i + 1] = 102;
        buffer[i + 2] = 241;
        buffer[i + 3] = 255;
      }
    }
  }

  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}
