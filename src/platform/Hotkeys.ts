import { CommandSinkRef, HotkeyConfig, HotkeySystem } from "../livesplit-core";
import { expect } from "../util/OptionUtil";

export interface HotkeyImplementation {
    config(): Promise<HotkeyConfig> | HotkeyConfig,
    setConfig(config: HotkeyConfig): void,
    activate(): void,
    deactivate(): void,
    resolve(keyCode: string): Promise<string> | string,
}

class GlobalHotkeys implements HotkeyImplementation {
    constructor(private hotkeySystem?: HotkeySystem) { }

    public async config(): Promise<HotkeyConfig> {
        return expect(HotkeyConfig.parseJson(
            await window.__TAURI__!.core.invoke("get_hotkey_config"),
        ), "Couldn't parse the hotkey config.");
    }

    public setConfig(config: HotkeyConfig): void {
        window.__TAURI__!.core.invoke("set_hotkey_config", { config: config.asJson() });
        if (this.hotkeySystem != null) {
            this.hotkeySystem.setConfig(config);
        } else {
            config[Symbol.dispose]();
        }
    }

    setConfigJson(configJson: unknown): void {
        window.__TAURI__!.core.invoke("set_hotkey_config", { config: configJson });
        if (this.hotkeySystem != null) {
            const config = HotkeyConfig.parseJson(configJson);
            if (config != null) {
                this.hotkeySystem.setConfig(config);
            }
        }
    }

    public activate(): void {
        window.__TAURI__!.core.invoke("set_hotkey_activation", { active: true });
        this.hotkeySystem?.activate();
    }

    public deactivate(): void {
        window.__TAURI__!.core.invoke("set_hotkey_activation", { active: false });
        this.hotkeySystem?.deactivate();
    }

    public resolve(keyCode: string): Promise<string> {
        return window.__TAURI__!.core.invoke("resolve_hotkey", { keyCode });
    }
}

export function createHotkeys(commandSink: CommandSinkRef, configJson: unknown): HotkeyImplementation {
    let hotkeySystem: HotkeySystem | null = null;

    const tauri = window.__TAURI__ != null;

    if (!tauri || navigator.platform === "Win32") {
        try {
            const config = HotkeyConfig.parseJson(configJson);
            if (config !== null) {
                hotkeySystem = HotkeySystem.withConfig(commandSink, config);
            }
        } catch (_) { /* Looks like the storage has no valid data */ }

        if (hotkeySystem == null) {
            hotkeySystem = expect(
                HotkeySystem.new(commandSink),
                "Couldn't initialize the hotkeys",
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
        return hotkeySystem!;
    }
}
