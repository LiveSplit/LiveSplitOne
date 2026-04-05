declare module "@babel/core" {
    // The Rolldown Babel plugin only references a small subset of Babel's
    // public option surface while typing vite.config.ts. Keeping this shim
    // intentionally narrow lets us avoid depending on the stale external
    // package while still preserving useful checking for the config we own.
    export type PluginItem = unknown;
    export type PresetItem = unknown;

    export interface InputOptions {
        assumptions?: Record<string, unknown>;
        auxiliaryCommentAfter?: string;
        auxiliaryCommentBefore?: string;
        comments?: boolean;
        compact?: boolean | "auto";
        cwd?: string;
        exclude?: unknown;
        generatorOpts?: Record<string, unknown>;
        include?: unknown;
        parserOpts?: Record<string, unknown>;
        plugins?: PluginItem[];
        retainLines?: boolean;
        shouldPrintComment?: (comment: string) => boolean;
        targets?: unknown;
        wrapPluginVisitorMethod?: (...args: unknown[]) => unknown;
    }

    export interface TransformOptions extends InputOptions { }
}
