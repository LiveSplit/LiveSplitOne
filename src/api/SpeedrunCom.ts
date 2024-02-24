import { Option, map } from "../util/OptionUtil";

const BASE_URI = "https://www.speedrun.com/api/v1/";

export interface Game {
    id: string,
    names: Names,
    abbreviation: string,
    weblink: string,
    released: number,
    "release-date": string,
    assets: Assets,
    ruleset: Rules,
    platforms: string[],
    regions: string[],
    variables?: Variables,
}

export interface Rules {
    "show-milliseconds": boolean,
    "require-verification": boolean,
    "require-video": boolean,
    "run-times": TimingMethod[],
    "default-time": TimingMethod,
    "emulators-allowed": boolean,
}

export type TimingMethod = "realtime" | "realtime_noloads" | "ingame";

export interface Variables {
    data: Variable[],
}

export interface Variable {
    id: string,
    name: string,
    category: Option<string>,
    scope: VariableScope,
    values: VariableValues,
    mandatory: boolean,
    "is-subcategory": boolean,
}

export interface VariableScope {
    type: "global" | "full-game" | "all-levels" | "single-level",
}

export interface VariableValues {
    values: { [id: string]: VariableValue },
    default: Option<string>,
}

export interface VariableValue {
    label: string,
    rules?: string,
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
    weblink: string,
    name: string,
    type: "per-game" | "per-level",
    rules: Option<string>,
}

export interface Leaderboard {
    weblink: string,
    runs: Record[],
    players?: PlayerData,
}

export interface PlayerData {
    data: User[],
}

export interface User {
    id: string,
    names: Names,
    weblink: string,
    "name-style": NameStyleSolid | NameStyleGradient,
    location: Option<UserLocation>,
}

export interface PlayerUser extends User {
    rel: "user",
}

export interface UserLocation {
    country: UserCountry,
}

export interface UserCountry {
    code: string,
}

export interface NameStyleSolid {
    style: "solid",
    color: Color,
}

export interface NameStyleGradient {
    style: "gradient",
    "color-from": Color,
    "color-to": Color,
}

export interface Color {
    light: string,
    dark: string,
}

export interface Record {
    place: number,
    run: Run,
}

export type PlayersNotEmbedded = Array<PlayerUserRef | PlayerGuest>;

export interface PlayersEmbedded {
    data: Array<PlayerUser | PlayerGuest>,
}

export interface Run<PlayerEmbedding = PlayersNotEmbedded> {
    id: string,
    weblink: string,
    game: string,
    category: string,
    videos: Option<Videos>,
    comment: Option<string>,
    players: PlayerEmbedding,
    date: Option<string>,
    submitted: Option<string>,
    times: Times,
    system: RunSystem,
    splits: Option<Splits>,
    values: { [key: string]: string | undefined },
}

export interface RunSystem {
    emulated: boolean,
    platform: string,
    region: Option<string>,
}

export interface Videos {
    links: Option<Video[]>,
}

export interface Video {
    uri: string,
}

export interface PlayerUserRef {
    rel: "user",
    id: string,
}

export interface PlayerGuest {
    rel: "guest",
    name: string,
}

export interface Times {
    primary: string,
    primary_t: number,
}

export interface Splits {
    uri: string,
}

export interface Platform {
    id: string,
    name: string,
}

export interface Region {
    id: string,
    name: string,
}

export type RunStatus = "new" | "verified" | "rejected";

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

function getPlatformsUri(subUri: string): string {
    const PLATFORMS_URI = "platforms";
    return `${BASE_URI}${PLATFORMS_URI}${subUri}`;
}

function getRegionsUri(subUri: string): string {
    const REGIONS_URI = "regions";
    return `${BASE_URI}${REGIONS_URI}${subUri}`;
}

function getRunsUri(subUri: string): string {
    const RUNS_URI = "runs";
    return `${BASE_URI}${RUNS_URI}${subUri}`;
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
            try {
                const page = await next();
                elements.push(...page.elements);
                next = page.next;
            } catch {
                break;
            }
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

export async function getGame(gameId: string, embeds?: Array<"variables">): Promise<Game> {
    const parameters = [];
    if (embeds !== undefined) {
        parameters.push(`embed=${embeds.join(",")}`);
    }
    const uri = getGamesUri(`/${gameId}${evaluateParameters(parameters)}`);
    return executeRequest<Game>(uri);
}

export async function getGames(name?: string): Promise<Page<Game>> {
    const parameters = [];
    if (name !== undefined && name !== "") {
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
    if (embeds !== undefined) {
        parameters.push(`embed=${embeds.join(",")}`);
    }
    const uri = getLeaderboardsUri(`/${gameId}/category/${categoryId}${evaluateParameters(parameters)}`);
    return executeRequest<Leaderboard>(uri);
}

export async function getPlatforms(elementsPerPage?: number): Promise<Page<Platform>> {
    const parameters = [];
    if (elementsPerPage !== undefined) {
        parameters.push(`max=${elementsPerPage}`);
    }
    const uri = getPlatformsUri(evaluateParameters(parameters));
    return executePaginatedRequest<Platform>(uri);
}

export async function getRegions(elementsPerPage?: number): Promise<Page<Region>> {
    const parameters = [];
    if (elementsPerPage !== undefined) {
        parameters.push(`max=${elementsPerPage}`);
    }
    const uri = getRegionsUri(evaluateParameters(parameters));
    return executePaginatedRequest<Region>(uri);
}

export async function getRuns(
    embedPlayers: true,
    categoryId?: string,
    elementsPerPage?: number,
    status?: RunStatus,
): Promise<Page<Run<PlayersEmbedded>>>;

export async function getRuns(
    embedPlayers: false,
    categoryId?: string,
    elementsPerPage?: number,
    status?: RunStatus,
): Promise<Page<Run<PlayersNotEmbedded>>>;

export async function getRuns(
    embedPlayers: boolean,
    categoryId?: string,
    elementsPerPage?: number,
    status?: RunStatus,
): Promise<Page<Run<PlayersEmbedded | PlayersNotEmbedded>>> {
    const parameters = [];
    if (categoryId !== undefined) {
        parameters.push(`category=${categoryId}`);
    }
    if (elementsPerPage !== undefined) {
        parameters.push(`max=${elementsPerPage}`);
    }
    if (embedPlayers) {
        parameters.push(`embed=${["players"].join(",")}`);
    }
    if (status !== undefined) {
        parameters.push(`status=${status}`);
    }
    parameters.push("orderby=submitted", "direction=desc");
    const uri = getRunsUri(evaluateParameters(parameters));
    return executePaginatedRequest<Run<PlayersEmbedded | PlayersNotEmbedded>>(uri);
}

export async function getRun(runId: string, embeds?: never[]): Promise<Run> {
    const parameters = [];
    if (embeds !== undefined) {
        parameters.push(`embed=${embeds.join(",")}`);
    }
    const uri = getRunsUri(`/${runId}${evaluateParameters(parameters)}`);
    return executeRequest<Run>(uri);
}
