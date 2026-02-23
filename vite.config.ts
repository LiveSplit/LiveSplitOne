import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import favicons from "favicons";

let faviconGenerationPromise: Promise<void> | undefined;
let faviconHtmlTags: string[] = [];

async function generateFavicons() {
    const source = path.resolve("src", "assets", "icon.svg");
    const outputDir = path.resolve("public", "icons");

    await fs.mkdir(outputDir, { recursive: true });

    const result = await favicons(source, {
        path: "/icons/",
        appName: "LiveSplit One",
        appDescription:
            "A version of LiveSplit that works on a lot of platforms.",
        developerName: "CryZe",
        developerURL: "https://livesplit.org",
        background: "#171717",
        theme_color: "#232323",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        lang: "en-US",
        appleStatusBarStyle: "black-translucent",
        manifestMaskable: path.resolve("src", "assets", "maskable.svg"),
        icons: {
            appleIcon: {
                offset: 10,
            },
            appleStartup: {
                offset: 15,
            },
            windows: false,
            yandex: false,
        } as any,
    });

    faviconHtmlTags = result.html;

    await Promise.all([
        ...result.images.map((image) =>
            fs.writeFile(path.join(outputDir, image.name), image.contents),
        ),
        ...result.files.map((file) =>
            fs.writeFile(path.join(outputDir, file.name), file.contents),
        ),
    ]);

    const screenshotDefs = [
        { file: "screenshot-wide.png", formFactor: "wide", sizes: "1280x720" },
        { file: "screenshot-narrow.png", formFactor: "narrow", sizes: "469x834" },
    ];
    const screenshots: { src: string; sizes: string; type: string; form_factor: string; label: string }[] = [];
    for (const def of screenshotDefs) {
        const srcPath = path.resolve("src", "assets", def.file);
        try {
            await fs.access(srcPath);
            await fs.copyFile(srcPath, path.join(outputDir, def.file));
            screenshots.push({
                src: `/icons/${def.file}`,
                sizes: def.sizes,
                type: "image/png",
                form_factor: def.formFactor,
                label: "LiveSplit One",
            });
        } catch {
            // Screenshot file not found, skip.
        }
    }
    if (screenshots.length > 0) {
        const manifestPath = path.join(outputDir, "manifest.webmanifest");
        const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
        manifest.screenshots = screenshots;
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    }
}

async function ensureFavicons() {
    faviconGenerationPromise ??= generateFavicons();
    await faviconGenerationPromise;
}

function parseChangelog() {
    return execSync('git log --grep "^Changelog" -10')
        .toString()
        .split(/^commit /m)
        .slice(1)
        .map((commit: string) => {
            const dateString = commit.match(/^Date:   (.*)$/m)?.[1];
            if (!dateString) {
                throw `Date not found in commit:\n${commit}`;
            }
            const dateValue = new Date(dateString);
            const date = dateValue.toISOString().split("T")[0];
            const id = commit.substring(0, commit.indexOf("\n"));
            const changelogEntries = parseChangelogEntries(commit);
            if (changelogEntries.length === 0) {
                throw `Changelog not found in commit:\n${commit}`;
            }
            const messages: Record<string, string> = {};
            for (const entry of changelogEntries) {
                messages[entry.lang] = entry.message;
            }
            const message =
                messages.en ??
                messages["en-US"] ??
                Object.values(messages)[0] ??
                "";
            return {
                id,
                message,
                messages,
                date,
            };
        })
        .filter((changelog: { message: string }) => changelog.message);
}

function parseChangelogEntries(commit: string) {
    const entries: { lang: string; message: string }[] = [];
    let current: { lang: string; message: string } | null = null;
    for (const line of commit.split("\n")) {
        const match = line.match(/^    Changelog(?:\s*\(([^)]+)\))?:\s*(.*)$/);
        if (match) {
            if (current) {
                current.message = current.message.trim();
                entries.push(current);
            }
            const lang = match[1] || "en";
            current = { lang, message: match[2] };
            continue;
        }
        if (current && line.startsWith("    ")) {
            current.message += `\n${line.replace(/^    /, "")}`;
        }
    }
    if (current) {
        current.message = current.message.trim();
        entries.push(current);
    }
    return entries.filter((entry) => entry.message);
}

async function getContributorsForRepo(repoName: string, githubToken?: string) {
    const contributorsData = await fetch(
        `https://api.github.com/repos/LiveSplit/${repoName}/contributors`,
        {
            headers: {
                ...(githubToken
                    ? { Authorization: `Bearer ${githubToken}` }
                    : {}),
            },
        },
    );

    if (!contributorsData.ok) {
        throw new Error(
            `GitHub API request for ${repoName} failed: ${contributorsData.status} ${contributorsData.statusText}`,
        );
    }

    return contributorsData.json();
}

function preloadPlugin() {
    let base = "/";

    return <Plugin>{
        name: "lso-preload-plugin",
        enforce: "post",
        configResolved(config: any) {
            base = config.base || "/";
        },
        transformIndexHtml: {
            order: "post" as const,
            handler(html: string) {
                // Inject with a placeholder that will replace
                // with the hashed URL.
                const preloads = [
                    `<link rel="preload" href="__WASM_PRELOAD_URL__" as="fetch" crossorigin>`,
                    `<link rel="preload" href="__FONT_TIMER_URL__" as="font" type="font/woff" crossorigin>`,
                    `<link rel="preload" href="__FONT_FIRA_URL__" as="font" type="font/woff" crossorigin>`,
                ].join("\n    ");
                const script = `<script>globalThis.__lscPreload=WebAssembly.compileStreaming(fetch("__WASM_PRELOAD_URL__"))</script>`;
                return html.replace("<head>", `<head>\n    ${preloads}\n    ${script}`);
            },
        },
        generateBundle(_options: any, bundle: any) {
            const wasmEntry = Object.keys(bundle).find((key: string) =>
                key.endsWith(".wasm"),
            );
            const timerFont = Object.keys(bundle).find((key: string) =>
                key.endsWith(".woff") && /(?:^|[\\/])timer[^/\\]*\.woff$/.test(key),
            );
            const firaFont = Object.keys(bundle).find((key: string) =>
                key.endsWith(".woff") && /(?:^|[\\/])FiraSans[^/\\]*\.woff$/.test(key),
            );

            for (const chunk of Object.values(bundle) as any[]) {
                if (
                    chunk.type === "asset" &&
                    chunk.fileName.endsWith(".html")
                ) {
                    let source = chunk.source as string;
                    if (wasmEntry) {
                        source = source.replaceAll(
                            "__WASM_PRELOAD_URL__",
                            `${base}${wasmEntry}`,
                        );
                    }
                    if (timerFont) {
                        source = source.replaceAll(
                            "__FONT_TIMER_URL__",
                            `${base}${timerFont}`,
                        );
                    }
                    if (firaFont) {
                        source = source.replaceAll(
                            "__FONT_FIRA_URL__",
                            `${base}${firaFont}`,
                        );
                    }
                    chunk.source = source;
                }
            }
        },
    };
}

export default defineConfig(async ({ mode }) => {
    const isTauri = mode === "tauri";
    const isProduction = mode === "production";

    await ensureFavicons();

    const isBuildOptimized = isProduction || isTauri;

    let contributorsList: { id: number; name: string }[] = [];
    const changelog = parseChangelog();
    try {
        const [lsoContributorsList, coreContributorsList] = await Promise.all([
            getContributorsForRepo("LiveSplitOne", process.env.GITHUB_TOKEN),
            getContributorsForRepo("livesplit-core", process.env.GITHUB_TOKEN),
        ]);

        const coreContributorsMap: Record<string, any> = {};
        for (const coreContributor of coreContributorsList) {
            if (
                coreContributor.type === "User" &&
                !coreContributor.login.includes("dependabot")
            ) {
                coreContributorsMap[coreContributor.login] = coreContributor;
            }
        }

        for (const lsoContributor of lsoContributorsList) {
            const existingContributor =
                coreContributorsMap[lsoContributor.login];
            if (existingContributor) {
                existingContributor.contributions +=
                    lsoContributor.contributions;
            } else if (
                lsoContributor.type === "User" &&
                !lsoContributor.login.includes("dependabot")
            ) {
                coreContributorsMap[lsoContributor.login] = lsoContributor;
            }
        }

        contributorsList = Object.values(coreContributorsMap)
            .sort((a: any, b: any) =>
                a.login > b.login ? 1 : b.login > a.login ? -1 : 0,
            )
            .sort((a: any, b: any) => b.contributions - a.contributions)
            .map((user: any) => {
                return { id: user.id, name: user.login };
            });
    } catch (e) {
        if (isBuildOptimized) {
            throw e;
        }
        console.warn("Failed to load GitHub data, skipping:", e);
    }

    const commitHash = execSync("git rev-parse --short HEAD").toString();
    const date = new Date()
        .toISOString()
        .replace("T", " ")
        .replace(/\..+/, " UTC");

    return {
        plugins: [
            isBuildOptimized ? preloadPlugin() : undefined,
            react({
                babel: {
                    plugins: [
                        // Necessary until Safari supports `using` declarations:
                        // https://caniuse.com/mdn-javascript_statements_using
                        // https://caniuse.com/mdn-javascript_statements_await_using
                        "@babel/plugin-transform-explicit-resource-management",
                    ],
                },
            }),
            ...(!isTauri
                ? [
                    {
                        name: "inject-generated-favicons",
                        transformIndexHtml(html: string) {
                            if (faviconHtmlTags.length === 0) {
                                return html;
                            }

                            return html.replace(
                                "</head>",
                                `${faviconHtmlTags.join("\n")}\n</head>`,
                            );
                        },
                    },
                ] as Plugin[]
                : []),
            ...(!isTauri && isProduction
                ? [
                    VitePWA({
                        registerType: "autoUpdate",
                        injectRegister: "inline",
                        manifest: false,
                        filename: "service-worker.js",
                        workbox: {
                            clientsClaim: true,
                            skipWaiting: true,
                            maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
                            globPatterns: [
                                "**/*.{js,css,html,wasm,woff}",
                            ],
                            globIgnores: ["icons/**"],
                            runtimeCaching: [
                                {
                                    urlPattern: ({ url }: { url: URL }) =>
                                        url.origin === self.origin &&
                                        url.pathname.startsWith("/icons/"),
                                    handler: "CacheFirst" as const,
                                },
                            ],
                        },
                    }),
                ]
                : []),
        ],
        define: {
            BUILD_DATE: JSON.stringify(date),
            COMMIT_HASH: JSON.stringify(commitHash),
            CONTRIBUTORS_LIST: JSON.stringify(contributorsList),
            CHANGELOG: JSON.stringify(changelog),
        },
        css: {
            modules: {
                generateScopedName: isBuildOptimized
                    ? "[hash:base64]"
                    : "[name]_[local]_[hash:base64]",
            },
        },
        build: {
            target: "esnext",
            outDir:
                isTauri
                    ? path.join("src-tauri", "target", "dist")
                    : path.join("dist"),
            emptyOutDir: true,
            chunkSizeWarningLimit: 1024,
        },
        esbuild: { legalComments: 'none' },
    } satisfies UserConfig;
});
