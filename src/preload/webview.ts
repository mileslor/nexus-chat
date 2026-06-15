// Injected into each messaging WebContentsView
// Intercepts Notification clicks to focus the correct account window

const OriginalNotification = window.Notification;

class PatchedNotification extends OriginalNotification {
  constructor(title: string, options?: NotificationOptions) {
    super(title, options);
    this.addEventListener('click', () => {
      window.focus();
    });
  }

  static get permission() {
    return OriginalNotification.permission;
  }

  static requestPermission(
    cb?: NotificationPermissionCallback
  ): Promise<NotificationPermission> {
    return OriginalNotification.requestPermission(cb);
  }
}

Object.defineProperty(window, 'Notification', {
  value: PatchedNotification,
  writable: false,
  configurable: true,
});
