const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { VitePlugin } = require('@electron-forge/plugin-vite');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'NexusChat',
    executableName: 'nexus-chat',
    icon: 'assets/icon',
    appBundleId: 'com.nexuschat.app',
    appVersion: '1.0.0',
    appCopyright: `Copyright © ${new Date().getFullYear()} Milestone Technology`,
    // macOS: entitlements for sandbox + hardened runtime (needed for notarization later)
    osxEntitlements: 'build/entitlements.mac.plist',
    protocols: [{ name: 'NexusChat', schemes: ['nexuschat'] }],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        name: 'NexusChat',
        icon: 'assets/icon.icns',
        format: 'ULFO',
        overwrite: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'NexusChat',
        setupIcon: 'assets/icon.ico',
        setupExe: 'NexusChatSetup.exe',
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: { owner: 'mileslor', name: 'nexus-chat' },
        prerelease: false,
        draft: true,
      },
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main/index.ts',      config: 'vite.main.config.ts',            target: 'main'    },
        { entry: 'src/preload/index.ts',   config: 'vite.preload.config.ts',         target: 'preload' },
        { entry: 'src/preload/webview.ts', config: 'vite.webview-preload.config.ts', target: 'preload' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
