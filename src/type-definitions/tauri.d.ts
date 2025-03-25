declare var __TAURI__: GlobalTauri | undefined;

declare interface GlobalTauri {
    core: CoreModule;
    event: TauriEventModule;
    notification: TauriNotificationModule;
    http: TauriHttpModule;
}

declare interface CoreModule {
    invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

declare interface TauriEventModule {
    listen(
        eventName: string,
        callback: (event: TauriEvent) => void,
    ): Promise<ListenHandle>;
}

declare interface TauriNotificationModule {
    isPermissionGranted(): Promise<boolean>;
    requestPermission(): Promise<string>;
    sendNotification(notification: TauriNotification): void;
}

declare interface TauriNotification {
    title: string;
    body: string;
}

declare interface TauriHttpModule {
    fetch(url: string, init?: RequestInit): Promise<Response>;
}

declare interface TauriEvent {
    event: string;
    payload: unknown;
}

declare interface ListenHandle {}
