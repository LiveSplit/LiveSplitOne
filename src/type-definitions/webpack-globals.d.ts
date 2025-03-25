declare const BUILD_DATE: string;
declare const COMMIT_HASH: string;
declare const CONTRIBUTORS_LIST: Contributor[];
declare const CHANGELOG: ChangelogEntry[];

declare interface Contributor {
    id: string;
    name: string;
}

declare interface ChangelogEntry {
    id: string;
    message: string;
    date: string;
}
