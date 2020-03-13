import { openDB, IDBPDatabase } from "idb";
import { Option } from "../util/OptionUtil";

export type HotkeyConfigSettings = unknown;
export type LayoutSettings = unknown;

const DEFAULT_LAYOUT_WIDTH = 300;

let db: Option<IDBPDatabase<unknown>> = null;

async function getDb(): Promise<IDBPDatabase<unknown>> {
    if (db == null) {
        db = await openDB("LiveSplit", 1, {
            upgrade(db) {
                db.createObjectStore("splits", {
                    autoIncrement: true,
                });
                db.createObjectStore("layouts", {
                    autoIncrement: true,
                });
                db.createObjectStore("settings", {
                    autoIncrement: true,
                });
            },
        });
    }
    return db;
}

export async function storeSplits(lssBytes: Uint8Array) {
    const db = await getDb();

    await db.put("splits", lssBytes, "splits");
}

export async function loadSplits():
    Promise<{ Array: { data: Uint8Array } } | { String: { data: string } } | undefined> {
    const db = await getDb();

    const splitsData = await db.get("splits", "splits");
    if (splitsData !== undefined) {
        return {
            Array: {
                data: splitsData,
            },
        };
    }

    const legacySplitsData = localStorage.getItem("splits");
    if (legacySplitsData !== null) {
        return {
            String: {
                data: legacySplitsData,
            },
        };
    }

    return;
}

export async function storeLayout(layout: LayoutSettings) {
    const db = await getDb();

    await db.put("layouts", layout, "layout");
}

export async function loadLayout(): Promise<LayoutSettings | undefined> {
    const db = await getDb();

    const layoutData = await db.get("layouts", "layout");
    if (layoutData !== undefined) {
        return layoutData;
    }

    const legacyLayoutData = localStorage.getItem("layout");
    if (legacyLayoutData !== null) {
        return JSON.parse(legacyLayoutData);
    }

    return;
}

export async function storeHotkeys(hotkeys: HotkeyConfigSettings) {
    const db = await getDb();

    await db.put("settings", hotkeys, "hotkeys");
}

export async function loadHotkeys(): Promise<HotkeyConfigSettings | undefined> {
    const db = await getDb();

    const hotkeysData = await db.get("settings", "hotkeys");
    if (hotkeysData !== undefined) {
        return hotkeysData;
    }

    const legacySettingsData = localStorage.getItem("settings");
    if (legacySettingsData !== null) {
        return JSON.parse(legacySettingsData).hotkeys;
    }

    return;
}

export async function storeLayoutWidth(layoutWidth: number) {
    const db = await getDb();

    await db.put("settings", layoutWidth, "layoutWidth");
}

export async function loadLayoutWidth(): Promise<number> {
    const db = await getDb();

    const layoutWidth = await db.get("settings", "layoutWidth");
    if (layoutWidth !== undefined) {
        return layoutWidth;
    }

    return +(localStorage.getItem("layoutWidth") ?? DEFAULT_LAYOUT_WIDTH);
}
