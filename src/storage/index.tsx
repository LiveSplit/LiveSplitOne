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
                const store = db.createObjectStore("settings", {
                    autoIncrement: true,
                });

                const splits = localStorage.getItem("splits");
                if (splits) {
                    store.put(new TextEncoder().encode(splits), "splits");
                }

                const layout = localStorage.getItem("layout");
                if (layout) {
                    store.put(JSON.parse(layout), "layout");
                }

                const hotkeys = localStorage.getItem("settings");
                if (hotkeys) {
                    store.put(JSON.parse(hotkeys).hotkeys, "hotkeys");
                }

                const layoutWidth = localStorage.getItem("layoutWidth");
                if (layoutWidth) {
                    store.put(+layoutWidth, "layoutWidth");
                }

                localStorage.clear();
            },
        });
    }
    return db;
}

export async function storeSplits(lssBytes: Uint8Array) {
    const db = await getDb();

    await db.put("settings", lssBytes, "splits");
}

export async function loadSplits(): Promise<Uint8Array | undefined> {
    const db = await getDb();

    return await db.get("settings", "splits");
}

export async function storeLayout(layout: LayoutSettings) {
    const db = await getDb();

    await db.put("settings", layout, "layout");
}

export async function loadLayout(): Promise<LayoutSettings | undefined> {
    const db = await getDb();

    return await db.get("settings", "layout");
}

export async function storeHotkeys(hotkeys: HotkeyConfigSettings) {
    const db = await getDb();

    await db.put("settings", hotkeys, "hotkeys");
}

export async function loadHotkeys(): Promise<HotkeyConfigSettings | undefined> {
    const db = await getDb();

    return await db.get("settings", "hotkeys");
}

export async function storeLayoutWidth(layoutWidth: number) {
    const db = await getDb();

    await db.put("settings", layoutWidth, "layoutWidth");
}

export async function loadLayoutWidth(): Promise<number> {
    const db = await getDb();

    return await db.get("settings", "layoutWidth") ?? DEFAULT_LAYOUT_WIDTH;
}
