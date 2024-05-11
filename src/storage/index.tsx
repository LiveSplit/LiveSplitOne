import { openDB, IDBPDatabase } from "idb";
import { Option, assert } from "../util/OptionUtil";
import { RunRef, Run } from "../livesplit-core";
import { GeneralSettings } from "../ui/SettingsEditor";
import { FRAME_RATE_AUTOMATIC } from "../util/FrameRate";

export type HotkeyConfigSettings = unknown;
export type LayoutSettings = unknown;

const DEFAULT_LAYOUT_WIDTH = 300;
const DEFAULT_LAYOUT_HEIGHT = 500;

let db: Option<Promise<IDBPDatabase<unknown>>> = null;

export interface SplitsInfo {
    game: string,
    category: string,
    realTime?: number,
    gameTime?: number,
}

function getSplitsInfo(run: RunRef): SplitsInfo {
    let realTime: number | undefined;
    let gameTime: number | undefined;
    if (run.len() > 0) {
        const time = run.segment(run.len() - 1).personalBestSplitTime();
        realTime = time.realTime()?.totalSeconds();
        gameTime = time.gameTime()?.totalSeconds();
    }
    return {
        game: run.gameName(),
        category: run.extendedCategoryName(true, true, true),
        realTime,
        gameTime,
    };
}

function parseSplitsAndGetInfo(splits: Uint8Array): Option<SplitsInfo> {
    return Run.parseArray(splits, "").with((r) => {
        if (r.parsedSuccessfully()) {
            return r.unwrap();
        }
        return undefined;
    })?.with(getSplitsInfo);
}

function getDb(): Promise<IDBPDatabase<unknown>> {
    if (db == null) {
        db = openDB("LiveSplit", 2, {
            async upgrade(db, oldVersion, _newVersion, tx) {
                const splitsDataStore = db.createObjectStore("splitsData", {
                    autoIncrement: true,
                });
                const splitsInfoStore = db.createObjectStore("splitsInfo", {
                    autoIncrement: true,
                });

                if (oldVersion === 1) {
                    const settingsStore = tx.objectStore("settings");
                    const splits = await settingsStore.get("splits");
                    if (splits != null) {
                        settingsStore.delete("splits");
                        const splitsInfo = parseSplitsAndGetInfo(splits);
                        if (splitsInfo != null) {
                            splitsInfoStore.put(splitsInfo);
                            splitsDataStore.put(splits);
                            settingsStore.put(1, "splitsKey");
                        }
                    }
                } else {
                    const settingsStore = db.createObjectStore("settings", {
                        autoIncrement: true,
                    });

                    const splitsString = localStorage.getItem("splits");
                    if (splitsString) {
                        const splits = new TextEncoder().encode(splitsString);
                        const splitsInfo = parseSplitsAndGetInfo(splits);
                        if (splitsInfo != null) {
                            splitsInfoStore.put(splitsInfo);
                            splitsDataStore.put(splits);
                            settingsStore.put(1, "splitsKey");
                        }
                    }

                    const layout = localStorage.getItem("layout");
                    if (layout) {
                        settingsStore.put(JSON.parse(layout), "layout");
                    }

                    const hotkeys = localStorage.getItem("settings");
                    if (hotkeys) {
                        settingsStore.put(JSON.parse(hotkeys).hotkeys, "hotkeys");
                    }

                    const layoutWidth = localStorage.getItem("layoutWidth");
                    if (layoutWidth) {
                        settingsStore.put(+layoutWidth, "layoutWidth");
                    }
                    localStorage.clear();
                }
            },
        });
    }
    return db;
}

export async function storeRunWithoutDisposing(run: RunRef, key: number | undefined) {
    await storeSplits(
        (callback) => {
            callback(run, run.saveAsLssBytes());
        },
        key,
    );
}

export async function storeRunAndDispose(run: Run, key: number | undefined) {
    try {
        await storeRunWithoutDisposing(run, key);
    } finally {
        run.dispose();
    }
}

export async function storeSplits(
    callback: (callback: (run: RunRef, lssBytes: Uint8Array) => void) => void,
    key: number | undefined,
): Promise<number> {
    const db = await getDb();

    const tx = db.transaction(["splitsData", "splitsInfo"], "readwrite");

    let promise: Promise<unknown> | null = null;
    callback((run, lssBytes) => {
        // We need to consume the bytes first as they are usually very
        // short-living, because they directly point into the WebAssembly memory.
        promise = tx.objectStore("splitsData").put(lssBytes, key);
        tx.objectStore("splitsInfo").put(getSplitsInfo(run), key);
    });

    await tx.done;

    assert(promise !== null, "Callback needs to actually run");
    return promise;
}

export async function getSplitsInfos(): Promise<Array<[number, SplitsInfo]>> {
    const db = await getDb();

    const tx = db.transaction("splitsInfo", "readonly");

    const arr: Array<[number, SplitsInfo]> = [];
    let cursor = await tx.store.openCursor();
    while (cursor) {
        arr.push([+cursor.key, cursor.value]);
        cursor = await cursor.continue();
    }

    return arr;
}

export async function loadSplits(key: number): Promise<Uint8Array | undefined> {
    const db = await getDb();

    return await db.get("splitsData", key);
}

export async function deleteSplits(key: number) {
    const db = await getDb();

    const tx = db.transaction(["splitsData", "splitsInfo"], "readwrite");
    tx.objectStore("splitsData").delete(key);
    tx.objectStore("splitsInfo").delete(key);
    await tx.done;
}

export async function copySplits(key: number) {
    const db = await getDb();

    const tx = db.transaction(["splitsData", "splitsInfo"], "readwrite");
    const splitsData = tx.objectStore("splitsData");
    splitsData.put(await splitsData.get(key));
    const splitsInfo = tx.objectStore("splitsInfo");
    splitsInfo.put(await splitsInfo.get(key));
    await tx.done;
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

export async function storeLayoutDims(layoutWidth: number, layoutHeight: number) {
    const db = await getDb();

    await db.put("settings", layoutWidth, "layoutWidth");
    await db.put("settings", layoutHeight, "layoutHeight");
}

export async function loadLayoutDims(): Promise<[number, number]> {
    const db = await getDb();

    return [
        await db.get("settings", "layoutWidth") ?? DEFAULT_LAYOUT_WIDTH,
        await db.get("settings", "layoutHeight") ?? DEFAULT_LAYOUT_HEIGHT,
    ];
}

export async function storeSplitsKey(splitsKey?: number) {
    const db = await getDb();

    await db.put("settings", splitsKey, "splitsKey");
}

export async function loadSplitsKey(): Promise<number | undefined> {
    const db = await getDb();

    return await db.get("settings", "splitsKey");
}

export async function storeGeneralSettings(generalSettings: GeneralSettings) {
    const db = await getDb();

    await db.put("settings", generalSettings, "generalSettings");
}

export async function loadGeneralSettings(): Promise<GeneralSettings> {
    const db = await getDb();

    const generalSettings = await db.get("settings", "generalSettings") ?? {};

    return {
        frameRate: generalSettings.frameRate ?? FRAME_RATE_AUTOMATIC,
        showControlButtons: generalSettings.showControlButtons ?? true,
        showManualGameTime: generalSettings.showManualGameTime ?? false,
    };
}
