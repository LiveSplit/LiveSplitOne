import * as fuzzy from "fuzzy";
import { getGameHeaders, getCategories as apiGetCategories } from "./SpeedrunCom";
import { Option } from "../util/OptionUtil";

const gameList: string[] = [];
const gameNameToIdMap: Map<string, string> = new Map();
const gameIdToCategoriesMap: Map<string, string[]> = new Map();
const gameIdToCategoriesPromises: Map<string, Promise<void>> = new Map();
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

export function getCategories(gameName: string): string[] | undefined {
    const gameId = getGameId(gameName);
    if (gameId == null) {
        return undefined;
    }
    return gameIdToCategoriesMap.get(gameId);
}

export function downloadCategories(gameId: string): Promise<void> {
    let categoryPromise = gameIdToCategoriesPromises.get(gameId);
    if (categoryPromise == null) {
        categoryPromise = (async () => {
            const categories = await apiGetCategories(gameId);
            const categoryNames = categories.filter((c) => c.type === "per-game").map((c) => c.name);
            gameIdToCategoriesMap.set(gameId, categoryNames);
        })();
        gameIdToCategoriesPromises.set(gameId, categoryPromise);
    }
    return categoryPromise;
}

export function downloadGameList(): Promise<void> {
    if (gameListPromise == null) {
        gameListPromise = (async () => {
            const pages = await getGameHeaders();
            pages.iterElementsWith((game) => {
                gameList.push(game.names.international);
                gameNameToIdMap.set(game.names.international, game.id);
            });
        })();
    }
    return gameListPromise;
}
