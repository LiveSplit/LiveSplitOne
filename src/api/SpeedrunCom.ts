import { Option, map } from "../util/OptionUtil";

const BASE_URI = "https://www.speedrun.com/api/v1/";

export interface Game {
    id: string,
    names: Names,
    abbreviation: string,
    weblink: string,
    released: number,
    "release-date": string,
    // TODO Remaining
    assets: Assets,
}

export interface GameHeader {
    id: string,
    names: Names,
    abbreviation: string,
    weblink: string,
}

export interface Names {
    international: string,
    japanese: Option<string>,
    twitch?: Option<string>,
}

export interface Assets {
    logo: Asset,
    "cover-tiny": Asset,
    "cover-small": Asset,
    "cover-medium": Asset,
    "cover-large": Asset,
    icon: Asset,
    "trophy-1st": Asset,
    "trophy-2nd": Asset,
    "trophy-3rd": Asset,
    "trophy-4th": Option<Asset>,
    background: Asset,
    foreground: Option<Asset>,
}

export interface Asset {
    uri: string,
    width: number,
    height: number,
}

export interface Category {
    id: string,
    name: string,
    type: "per-game" | "per-level",
    rules: Option<string>,
}

export interface Leaderboard {
    runs: Record[],
    players?: PlayerData,
}

export interface PlayerData {
    data: Player[],
}

export interface Player {
    id: string,
    names: Names,
    weblink: string,
}

export interface Record {
    place: number,
    run: Run,
}

export interface Run {
    comment: string,
    players: Array<PlayerUserRef | PlayerGuestRef>,
    times: Times,
    splits: Option<Splits>,
    weblink: string,
}

export interface PlayerUserRef {
    rel: "user",
    id: string,
}

export interface PlayerGuestRef {
    rel: "guest",
    name: string,
}

export interface Times {
    primary: string,
}

export interface Splits {
    uri: string,
}

function evaluateParameters(parameters: string[]): string {
    const filtered = parameters.filter((p) => p.trim() !== "");
    if (filtered.length !== 0) {
        return `?${filtered.join("&")}`;
    } else {
        return "";
    }
}

function getGamesUri(subUri: string): string {
    const GAMES_URI = "games";
    return `${BASE_URI}${GAMES_URI}${subUri}`;
}

function getLeaderboardsUri(subUri: string): string {
    const LEADERBOARDS_URI = "leaderboards";
    return `${BASE_URI}${LEADERBOARDS_URI}${subUri}`;
}

async function executeRequest<T>(uri: string): Promise<T> {
    const response = await fetch(uri);
    const responseData = await response.json();
    return responseData.data as T;
}

export class Page<T> {
    public constructor(
        public elements: T[],
        public next: Option<() => Promise<Page<T>>>,
    ) { }

    public async evaluateAll(): Promise<T[]> {
        const elements = this.elements;
        let next = this.next;
        while (next != null) {
            const page = await next();
            elements.push(...page.elements);
            next = page.next;
        }
        return elements;
    }

    public async iterElementsWith(closure: (element: T) => boolean | undefined | void) {
        let elements = this.elements;
        let next = this.next;
        while (true) {
            for (const element of elements) {
                if (closure(element) === false) {
                    break;
                }
            }
            if (next != null) {
                const page = await next();
                elements = page.elements;
                next = page.next;
            } else {
                break;
            }
        }
    }

    public map<R>(closure: (element: T) => R): Page<R> {
        const next = map(this.next, (nextFn) => async () => {
            const awaited = await nextFn();
            return awaited.map(closure);
        });
        return new Page(this.elements.map(closure), next);
    }
}

async function executePaginatedRequest<T>(uri: string): Promise<Page<T>> {
    const response = await fetch(uri);
    const { data, pagination } = await response.json();
    let next = null;
    if (pagination.links != null) {
        const nextLink = pagination.links.find((l: any) => l.rel === "next");
        if (nextLink != null) {
            const link = nextLink.uri as string;
            next = () => executePaginatedRequest<T>(link);
        }
    }
    return new Page(data as T[], next);
}

export async function getGame(gameId: string): Promise<Game> {
    const uri = getGamesUri(`/${gameId}`);
    return executeRequest<Game>(uri);
}

export async function getGames(name?: string): Promise<Page<Game>> {
    const parameters = [];
    if (name != null && name !== "") {
        parameters.push(`name=${encodeURIComponent(name)}`);
    }
    // TODO Remaining parameters
    const uri = getGamesUri(evaluateParameters(parameters));
    return executePaginatedRequest<Game>(uri);
}

export async function getGameHeaders(elementsPerPage: number = 1000): Promise<Page<GameHeader>> {
    const parameters = ["_bulk=yes", `max=${elementsPerPage}`];
    // TODO Remaining parameters
    const uri = getGamesUri(evaluateParameters(parameters));
    return executePaginatedRequest<GameHeader>(uri);
}

export async function getCategories(gameId: string): Promise<Category[]> {
    // TODO Remaining parameters
    const uri = getGamesUri(`/${gameId}/categories`);
    return executeRequest<Category[]>(uri);
}

export async function getLeaderboard(
    gameId: string,
    categoryId: string,
    embeds?: Array<"players">,
): Promise<Leaderboard> {
    const parameters = [];
    if (embeds != null) {
        parameters.push(`embed=${embeds.join(",")}`);
    }
    const uri = getLeaderboardsUri(`/${gameId}/category/${categoryId}${evaluateParameters(parameters)}`);
    return executeRequest<Leaderboard>(uri);
}
