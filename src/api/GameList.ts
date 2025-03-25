import {
    getGameHeaders,
    getCategories as apiGetCategories,
    Category,
    getRuns as apiGetRuns,
    getPlatforms as apiGetPlatforms,
    getRegions as apiGetRegions,
    getGame as apiGetGame,
    Game,
    Run,
    PlayersEmbedded,
} from "./SpeedrunCom";
import { Option } from "../util/OptionUtil";
import { FuzzyList } from "../livesplit-core";

const gameList: string[] = [];
let fuzzyList: Option<FuzzyList> = null;
const platformList: Map<string, string> = new Map();
const regionList: Map<string, string> = new Map();
const gameNameToIdMap: Map<string, string> = new Map();
const gameIdToCategoriesMap: Map<string, Category[]> = new Map();
const gameIdToCategoriesPromises: Map<string, Promise<Category[]>> = new Map();
const gameIdToGameInfoMap: Map<string, Game> = new Map();
const gameIdToGameInfoPromises: Map<string, Promise<Game>> = new Map();
const gameAndCategoryToLeaderboardPromises: Map<
    string,
    Promise<void>
> = new Map();
const gameAndCategoryToLeaderboardMap: Map<
    string,
    Array<Run<PlayersEmbedded>>
> = new Map();
let gameListPromise: Option<Promise<void>> = null;
let platformListPromise: Option<Promise<void>> = null;
let regionListPromise: Option<Promise<void>> = null;

export function searchGames(currentName: string): string[] {
    if (currentName === "" || fuzzyList == null) {
        return [];
    }

    return fuzzyList.search(currentName, 15);
}

export function getGameId(gameName: string): string | undefined {
    return gameNameToIdMap.get(gameName);
}

export function getCategories(gameName: string): Category[] | undefined {
    const gameId = getGameId(gameName);
    if (gameId === undefined) {
        return undefined;
    }
    return gameIdToCategoriesMap.get(gameId);
}

export function getGameInfo(gameName: string): Game | undefined {
    const gameId = getGameId(gameName);
    if (gameId === undefined) {
        return undefined;
    }
    return gameIdToGameInfoMap.get(gameId);
}

export function getPlatforms(): Map<string, string> {
    return platformList;
}

export function getRegions(): Map<string, string> {
    return regionList;
}

export function getLeaderboard(
    gameName: string,
    categoryName: string,
): Array<Run<PlayersEmbedded>> | undefined {
    const key = JSON.stringify({ gameName, categoryName });
    return gameAndCategoryToLeaderboardMap.get(key);
}

export function downloadCategoriesByGameId(
    gameId: string,
): Promise<Category[]> {
    let categoryPromise = gameIdToCategoriesPromises.get(gameId);
    if (categoryPromise === undefined) {
        categoryPromise = (async () => {
            const categories = await apiGetCategories(gameId);
            const categoryNames = categories.filter(
                (c) => c.type === "per-game",
            );
            gameIdToCategoriesMap.set(gameId, categoryNames);
            return categories;
        })();
        gameIdToCategoriesPromises.set(gameId, categoryPromise);
    }
    return categoryPromise;
}

export async function downloadCategories(
    gameName: string,
): Promise<Option<string>> {
    await downloadGameList();
    const gameId = getGameId(gameName);
    if (gameId !== undefined) {
        await downloadCategoriesByGameId(gameId);
    }
    return gameId;
}

export function downloadGameInfoByGameId(gameId: string): Promise<Game> {
    let gameInfoPromise = gameIdToGameInfoPromises.get(gameId);
    if (gameInfoPromise === undefined) {
        gameInfoPromise = (async () => {
            const gameInfo = await apiGetGame(gameId, ["variables"]);
            gameIdToGameInfoMap.set(gameId, gameInfo);
            return gameInfo;
        })();
        gameIdToGameInfoPromises.set(gameId, gameInfoPromise);
    }
    return gameInfoPromise;
}

export async function downloadGameInfo(gameName: string): Promise<void> {
    await downloadGameList();
    const gameId = getGameId(gameName);
    if (gameId !== undefined) {
        await downloadGameInfoByGameId(gameId);
    }
}

export function gameListLength(): number {
    return gameList.length;
}

export function downloadGameList(): Promise<void> {
    if (gameListPromise == null) {
        gameListPromise = (async () => {
            const pages = await getGameHeaders();
            await pages.iterElementsWith((game) => {
                gameList.push(game.names.international);
                if (fuzzyList == null) {
                    fuzzyList = FuzzyList.new();
                }
                fuzzyList.push(game.names.international);
                gameNameToIdMap.set(game.names.international, game.id);
            });
        })();
    }
    return gameListPromise;
}

export function platformListLength(): number {
    return platformList.size;
}

export function downloadPlatformList(): Promise<void> {
    if (platformListPromise == null) {
        platformListPromise = (async () => {
            const pages = await apiGetPlatforms();
            await pages.iterElementsWith((platform) => {
                platformList.set(platform.id, platform.name);
            });
        })();
    }
    return platformListPromise;
}

export function regionListLength(): number {
    return regionList.size;
}

export function downloadRegionList(): Promise<void> {
    if (regionListPromise == null) {
        regionListPromise = (async () => {
            const pages = await apiGetRegions();
            await pages.iterElementsWith((region) => {
                regionList.set(region.id, region.name);
            });
        })();
    }
    return regionListPromise;
}

export async function downloadLeaderboard(
    gameName: string,
    categoryName: string,
): Promise<void> {
    const key = JSON.stringify({ gameName, categoryName });
    let promise = gameAndCategoryToLeaderboardPromises.get(key);
    if (promise === undefined) {
        promise = (async () => {
            const gameId = await downloadCategories(gameName);
            if (gameId == null) {
                return;
            }
            const categories = getCategories(gameName);
            if (categories === undefined) {
                return;
            }
            const index = categories.map((c) => c.name).indexOf(categoryName);
            if (index < 0) {
                return;
            }
            const category = categories[index];
            const runPages = await apiGetRuns(
                true,
                category.id,
                500,
                "verified",
            );
            const runsUnsorted = await runPages.evaluateAll();
            const runsSorted = runsUnsorted.sort(
                (a, b) => a.times.primary_t - b.times.primary_t,
            );
            gameAndCategoryToLeaderboardMap.set(key, runsSorted);
        })();
        gameAndCategoryToLeaderboardPromises.set(key, promise);
    }
    return promise;
}
