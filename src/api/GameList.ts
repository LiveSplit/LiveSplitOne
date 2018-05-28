import {
    getGameHeaders, getCategories as apiGetCategories, Category,
    getLeaderboard as apiGetLeaderboard, Leaderboard,
    getPlatforms as apiGetPlatforms, getRegions as apiGetRegions,
    getGame as apiGetGame,
    Game,
} from "./SpeedrunCom";
import { Option } from "../util/OptionUtil";
import { FuzzyList } from "../livesplit";
import { emoteList } from "./EmoteList";

const gameList: string[] = [];
let fuzzyList: Option<FuzzyList> = null;
const platformList: Map<string, string> = new Map();
const regionList: Map<string, string> = new Map();
const gameNameToIdMap: Map<string, string> = new Map();
const gameIdToCategoriesMap: Map<string, Category[]> = new Map();
const gameIdToCategoriesPromises: Map<string, Promise<void>> = new Map();
const gameIdToGameInfoMap: Map<string, Game> = new Map();
const gameIdToGameInfoPromises: Map<string, Promise<void>> = new Map();
const gameAndCategoryToLeaderboardPromises: Map<string, Promise<void>> = new Map();
const gameAndCategoryToLeaderboardMap: Map<string, Leaderboard> = new Map();
let gameListPromise: Option<Promise<void>> = null;
let platformListPromise: Option<Promise<void>> = null;
let regionListPromise: Option<Promise<void>> = null;
let twitchEmotePromise: Option<Promise<void>> = null;
const twitchEmoteMap: Map<string, number> = new Map();

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
    if (gameId == null) {
        return undefined;
    }
    return gameIdToCategoriesMap.get(gameId);
}

export function getGameInfo(gameName: string): Game | undefined {
    const gameId = getGameId(gameName);
    if (gameId == null) {
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

function downloadGameInfoByGameId(gameId: string): Promise<void> {
    let gameInfoPromise = gameIdToGameInfoPromises.get(gameId);
    if (gameInfoPromise == null) {
        gameInfoPromise = (async () => {
            const gameInfo = await apiGetGame(gameId, ["variables"]);
            gameIdToGameInfoMap.set(gameId, gameInfo);
        })();
        gameIdToGameInfoPromises.set(gameId, gameInfoPromise);
    }
    return gameInfoPromise;
}

export async function downloadGameInfo(gameName: string): Promise<void> {
    await downloadGameList();
    const gameId = getGameId(gameName);
    if (gameId != null) {
        await downloadGameInfoByGameId(gameId);
    }
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

export async function downloadTwitchEmotes(): Promise<void> {
    if (twitchEmotePromise == null) {
        twitchEmotePromise = (async () => {
            const response = await fetch("https://twitchemotes.com/api_cache/v3/global.json");
            const emotes = await response.json();
            for (const emote of emotes) {
                twitchEmoteMap.set(emote.code, emote.id);
            }
        })();
    }
    return twitchEmotePromise;
}

export function replaceTwitchEmotes(text: string): string {
    return text.replace(/[A-Za-z0-9<):(\\;_>#/\]|]+/g, (matched) => {
        const emoteId = emoteList[matched];
        if (emoteId == null) {
            return matched;
        }

        const url = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/1.0`;
        return `![${url}](${url})`;
    });
}
