import * as fuzzy from "fuzzy";
import {
    getGameHeaders, getCategories as apiGetCategories, Category,
    getLeaderboard as apiGetLeaderboard, Leaderboard,
} from "./SpeedrunCom";
import { Option } from "../util/OptionUtil";

const gameList: string[] = [];
const gameNameToIdMap: Map<string, string> = new Map();
const gameIdToCategoriesMap: Map<string, Category[]> = new Map();
const gameIdToCategoriesPromises: Map<string, Promise<void>> = new Map();
const gameAndCategoryToLeaderboardPromises: Map<string, Promise<void>> = new Map();
const gameAndCategoryToLeaderboardMap: Map<string, Leaderboard> = new Map();
let gameListPromise: Option<Promise<void>> = null;

export function searchGames(currentName: string): string[] {
    if (currentName === "") {
        return [];
    }

    let list = fuzzy.filter(currentName, gameList);
    if (list.length > 15) {
        list = list.slice(0, 15);
    }
    return list.map((r) => r.original);
}

export function getGameId(gameName: string): string | undefined {
    return gameNameToIdMap.get(gameName);
}

export function getCategories(gameName: string): Category[] | undefined {
    const gameId = getGameId(gameName);
    if (gameId == null) {
        return undefined;
    }
    return gameIdToCategoriesMap.get(gameId);
}

export function getLeaderboard(gameName: string, categoryName: string): Leaderboard | undefined {
    const key = `${gameName}::cx::${categoryName}`; // TODO Properly escape
    return gameAndCategoryToLeaderboardMap.get(key);
}

function downloadCategoriesByGameId(gameId: string): Promise<void> {
    let categoryPromise = gameIdToCategoriesPromises.get(gameId);
    if (categoryPromise == null) {
        categoryPromise = (async () => {
            const categories = await apiGetCategories(gameId);
            const categoryNames = categories.filter((c) => c.type === "per-game");
            gameIdToCategoriesMap.set(gameId, categoryNames);
        })();
        gameIdToCategoriesPromises.set(gameId, categoryPromise);
    }
    return categoryPromise;
}

export async function downloadCategories(gameName: string): Promise<Option<string>> {
    await downloadGameList();
    const gameId = getGameId(gameName);
    if (gameId != null) {
        await downloadCategoriesByGameId(gameId);
    }
    return gameId;
}

export function downloadGameList(): Promise<void> {
    if (gameListPromise == null) {
        gameListPromise = (async () => {
            const pages = await getGameHeaders();
            await pages.iterElementsWith((game) => {
                gameList.push(game.names.international);
                gameNameToIdMap.set(game.names.international, game.id);
            });
        })();
    }
    return gameListPromise;
}

export async function downloadLeaderboard(gameName: string, categoryName: string): Promise<void> {
    const key = `${gameName}::cx::${categoryName}`; // TODO Properly escape
    let promise = gameAndCategoryToLeaderboardPromises.get(key);
    if (promise == null) {
        promise = (async () => {
            const gameId = await downloadCategories(gameName);
            if (gameId == null) {
                return;
            }
            const categories = getCategories(gameName);
            if (categories == null) {
                return;
            }
            const index = categories.map((c) => c.name).indexOf(categoryName);
            if (index < 0) {
                return;
            }
            const category = categories[index];
            const leaderboard = await apiGetLeaderboard(gameId, category.id, ["players"]);
            gameAndCategoryToLeaderboardMap.set(key, leaderboard);
        })();
        gameAndCategoryToLeaderboardPromises.set(key, promise);
    }
    return promise;
}
