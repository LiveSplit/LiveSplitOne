import {
    type CommandSinkRef,
    HotkeyConfig,
    HotkeySystem,
    type Language,
} from "../livesplit-core";
import { expect } from "../util/OptionUtil";

export interface HotkeyImplementation {
    config(lang: Language | undefined): Promise<HotkeyConfig> | HotkeyConfig;
    setConfig(config: HotkeyConfig): void;
    activate(): void;
    deactivate(): void;
    resolve(keyCode: string): Promise<string> | string;
    addWindow(window: Window): void;
}

class LocalHotkeys implements HotkeyImplementation {
    constructor(private hotkeySystem: HotkeySystem) {}

    public config(_lang: Language | undefined): HotkeyConfig {
        return this.hotkeySystem.config();
    }

    public setConfig(config: HotkeyConfig): void {
        this.hotkeySystem.setConfig(config);
    }

    public activate(): void {
        this.hotkeySystem.activate();
    }

    public deactivate(): void {
        this.hotkeySystem.deactivate();
    }

    public resolve(keyCode: string): string {
        return this.hotkeySystem.resolve(keyCode);
    }

    public addWindow(childWindow: Window): void {
        childWindow.addEventListener("keydown", (event) => {
            // Each browser window has its own JavaScript realm. Forwarding a
            // newly-created event into the main window lets the existing
            // hotkey listener process popup input without passing a child
            // realm's Window or KeyboardEvent through the WASM boundary.
            const forwardedEvent = new KeyboardEvent(event.type, {
                key: event.key,
                code: event.code,
                location: event.location,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                metaKey: event.metaKey,
                repeat: event.repeat,
                isComposing: event.isComposing,
                bubbles: true,
                cancelable: true,
            });

            if (!window.dispatchEvent(forwardedEvent)) {
                event.preventDefault();
            }
        });
    }
}

class GlobalHotkeys implements HotkeyImplementation {
    constructor(private hotkeySystem?: HotkeySystem) {}

    public async config(lang: Language | undefined): Promise<HotkeyConfig> {
        return expect(
            HotkeyConfig.parseJson(
                await window.__TAURI__!.core.invoke("get_hotkey_config"),
            ),
            "Couldn't parse the hotkey config.",
            lang,
        );
    }

    public setConfig(config: HotkeyConfig): void {
        window.__TAURI__!.core.invoke("set_hotkey_config", {
            config: config.asJson(),
        });
        if (this.hotkeySystem != null) {
            this.hotkeySystem.setConfig(config);
        } else {
            config[Symbol.dispose]();
        }
    }

    setConfigJson(configJson: unknown): void {
        window.__TAURI__!.core.invoke("set_hotkey_config", {
            config: configJson,
        });
        if (this.hotkeySystem != null) {
            const config = HotkeyConfig.parseJson(configJson);
            if (config != null) {
                this.hotkeySystem.setConfig(config);
            }
        }
    }

    public activate(): void {
        window.__TAURI__!.core.invoke("set_hotkey_activation", {
            active: true,
        });
        this.hotkeySystem?.activate();
    }

    public deactivate(): void {
        window.__TAURI__!.core.invoke("set_hotkey_activation", {
            active: false,
        });
        this.hotkeySystem?.deactivate();
    }

    public resolve(keyCode: string): Promise<string> {
        return window.__TAURI__!.core.invoke("resolve_hotkey", { keyCode });
    }

    public addWindow(_window: Window): void {
        // Tauri's hotkeys are global and already receive input regardless of
        // which application window has focus. Adding a local listener as well
        // would make a popup key press trigger the same command twice.
    }
}

export function createHotkeys(
    commandSink: CommandSinkRef,
    configJson: unknown,
    lang: Language | undefined,
): HotkeyImplementation {
    let hotkeySystem: HotkeySystem | null = null;

    const tauri = window.__TAURI__ != null;

    if (!tauri || navigator.platform === "Win32") {
        try {
            const config = HotkeyConfig.parseJson(configJson);
            if (config !== null) {
                hotkeySystem = HotkeySystem.withConfig(commandSink, config);
            }
        } catch (_) {
            /* Looks like the storage has no valid data */
        }

        if (hotkeySystem == null) {
            hotkeySystem = expect(
                HotkeySystem.new(commandSink),
                "Couldn't initialize the hotkeys",
                lang,
            );
        }
    }

    if (tauri) {
        const globalHotkeys = new GlobalHotkeys(hotkeySystem ?? undefined);
        if (configJson != null) {
            globalHotkeys.setConfigJson(configJson);
        }
        return globalHotkeys;
    } else {
        return new LocalHotkeys(hotkeySystem!);
    }
}
