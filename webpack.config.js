import HtmlWebpackPlugin from "html-webpack-plugin";
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin';
import FaviconsWebpackPlugin from "favicons-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import WorkboxPlugin from "workbox-webpack-plugin";
import ReactRefreshTypeScript from 'react-refresh-typescript';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import webpack from "webpack";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';
import { defineReactCompilerLoaderOption, reactCompilerLoader } from "react-compiler-webpack";

function parseChangelog() {
    return execSync("git log --grep \"^Changelog: \" -10")
        .toString()
        .split(/^commit /m)
        .slice(1)
        .map((commit) => {
            const changelogIndex = commit.indexOf("    Changelog: ");
            if (changelogIndex === -1) {
                throw `Changelog not found in commit:\n${commit}`;
            }
            const dateString = commit.match(/^Date:   (.*)$/m)?.[1];
            if (!dateString) {
                throw `Date not found in commit:\n${commit}`;
            }
            const dateValue = new Date(dateString);
            const date = dateValue.toISOString().split('T')[0];
            const id = commit.substring(0, commit.indexOf("\n"));
            const message = commit
                .substring(changelogIndex + 15)
                .replaceAll("\n    ", "\n")
                .trim();
            return {
                id,
                message,
                date,
            };
        })
        .filter((changelog) => changelog.message);
}

export default async (env, argv) => {
    const getContributorsForRepo = async (repoName) => {
        const contributorsData = await fetch(`https://api.github.com/repos/LiveSplit/${repoName}/contributors`, {
            headers: {
                "Authorization": env.GITHUB_TOKEN ? `Bearer ${env.GITHUB_TOKEN}` : undefined,
            },
        });
        return contributorsData.json();
    }

    const lsoContributorsList = await getContributorsForRepo("LiveSplitOne");
    const coreContributorsList = await getContributorsForRepo("livesplit-core");

    const coreContributorsMap = {};
    for (const coreContributor of coreContributorsList) {
        if (coreContributor.type === "User" && !coreContributor.login.includes("dependabot")) {
            coreContributorsMap[coreContributor.login] = coreContributor;
        }
    }

    for (let lsoContributor of lsoContributorsList) {
        const existingContributor = coreContributorsMap[lsoContributor.login];
        if (existingContributor) {
            existingContributor.contributions += lsoContributor.contributions;
        } else if (lsoContributor.type === "User" && !lsoContributor.login.includes("dependabot")) {
            coreContributorsMap[lsoContributor.login] = lsoContributor;
        }
    }

    const contributorsList = Object.values(coreContributorsMap)
        // Sort by contributions, but fallback to alphabetical order for the
        // same amount of contributions
        .sort((a, b) => a.login > b.login ? 1 : b.login > a.login ? -1 : 0)
        .sort((a, b) => b.contributions - a.contributions)
        .map((user) => {
            return { id: user.id, name: user.login };
        });
    const commitHash = execSync("git rev-parse --short HEAD").toString();
    const date = new Date().toISOString().replace("T", " ").replace(/\..+/, " UTC");

    const changelog = parseChangelog();

    const basePath = path.dirname(fileURLToPath(import.meta.url));

    const isProduction = argv.mode === "production";
    const isTauri = env.TAURI === "true";
    const distPath = path.join(...[
        basePath,
        ...(isTauri ? ["src-tauri", "target", "dist"] : ["dist"]),
    ]);

    return {
        entry: {
            "bundle": ["./src/index.tsx"],
        },
        output: {
            filename: "[name].js",
            path: distPath,
            publicPath: '',
        },

        devtool: isProduction ? undefined : "source-map",

        devServer: {
            port: 8080,
            hot: true
        },

        resolve: {
            extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".json", ".wasm"],
        },

        plugins: [
            ...(isProduction ? [new CleanWebpackPlugin({
                protectWebpackAssets: false,
                cleanAfterEveryBuildPatterns: ['*.LICENSE.txt'],
            })] : []),
            ...(isTauri ? [] : [new FaviconsWebpackPlugin({
                logo: path.resolve("src/assets/icon.svg"),
                inject: true,
                logoMaskable: path.resolve("src/assets/maskable.svg"),
                favicons: {
                    appName: "LiveSplit One",
                    appDescription: "A version of LiveSplit that works on a lot of platforms.",
                    developerName: "CryZe",
                    developerURL: "https://livesplit.org",
                    background: "#171717",
                    theme_color: "#232323",
                    appleStatusBarStyle: "black-translucent",
                    icons: {
                        appleIcon: {
                            offset: 10,
                        },
                        appleStartup: {
                            offset: 15,
                        },
                        windows: false,
                        coast: false,
                        yandex: false,
                    },
                    start_url: "/",
                },
            })]),
            new HtmlWebpackPlugin({
                template: "./src/index.html",
            }),
            new webpack.DefinePlugin({
                BUILD_DATE: JSON.stringify(date),
                COMMIT_HASH: JSON.stringify(commitHash),
                CONTRIBUTORS_LIST: JSON.stringify(contributorsList),
                CHANGELOG: JSON.stringify(changelog),
            }),
            ...(isProduction ? [
                new HtmlInlineScriptPlugin({
                    scriptMatchPattern: ['^bundle.js$'],
                }),
                ...(isTauri ? [] : [new WorkboxPlugin.GenerateSW({
                    clientsClaim: true,
                    skipWaiting: true,
                    maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
                    exclude: [
                        /^assets/,
                        /\.LICENSE\.txt$/,
                    ],

                    runtimeCaching: [{
                        urlPattern: (context) => {
                            return self.origin === context.url.origin &&
                                context.url.pathname.startsWith("/assets/");
                        },
                        handler: "CacheFirst",
                    }],
                })])
            ] : []),
            ...(!isProduction ? [new ReactRefreshWebpackPlugin()] : []),
        ],

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
                        ...(isProduction ? [{
                            loader: reactCompilerLoader,
                            options: defineReactCompilerLoaderOption({
                                babelTransFormOpt: {
                                    plugins: [
                                        "@babel/plugin-proposal-explicit-resource-management",
                                    ],
                                },
                            }),
                        }] : []),
                        {
                            loader: "ts-loader",
                            options: {
                                getCustomTransformers: () => ({
                                    before: [!isProduction && ReactRefreshTypeScript()].filter(Boolean),
                                }),
                                transpileOnly: !isProduction,
                            },
                        },
                    ],
                    exclude: "/node_modules",
                },
                {
                    test: /\.(s?)css$/,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                importLoaders: 1,
                                modules: {
                                    auto: true,
                                },
                            },
                        },
                        "sass-loader",
                    ],
                },
                {
                    test: /\.(png|jpg|gif|woff|ico|svg)$/,
                    type: 'asset/resource'
                },
            ],
        },

        mode: isProduction ? "production" : "development",
    };
};
