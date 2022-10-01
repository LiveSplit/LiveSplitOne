import HtmlWebpackPlugin from "html-webpack-plugin";
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin';
import FaviconsWebpackPlugin from "favicons-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import WorkboxPlugin from "workbox-webpack-plugin";
import ReactRefreshTypeScript from 'react-refresh-typescript';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import webpack from "webpack";
import { execSync } from "child_process";
import moment from "moment";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from 'url';
import sass from "sass";

export default async (env, argv) => {
    const getContributorsForRepo = async (repoName) => {
        const contributorsData = await fetch(`https://api.github.com/repos/LiveSplit/${repoName}/contributors`);
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
        .sort((user1, user2) => user2.contributions - user1.contributions)
        .map((user) => user.login);
    const commitHash = execSync("git rev-parse --short HEAD").toString();
    const date = moment.utc().format("YYYY-MM-DD kk:mm:ss");

    const basePath = path.dirname(fileURLToPath(import.meta.url));

    const isProduction = argv.mode === "production";
    const distPath = path.join(basePath, "dist");

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
            ...(isProduction ? [new CleanWebpackPlugin()] : []),
            new FaviconsWebpackPlugin({
                logo: path.resolve("src/assets/icon.png"),
                inject: true,
                favicons: {
                    appName: "LiveSplit One",
                    appDescription: "A version of LiveSplit that works on a lot of platforms.",
                    developerName: "CryZe",
                    developerURL: "https://livesplit.org",
                    background: "#171717",
                    theme_color: "#232323",
                    appleStatusBarStyle: "black-translucent",
                    icons: {
                        coast: false,
                        yandex: false,
                    },
                    start_url: "/",
                },
            }),
            new HtmlWebpackPlugin({
                template: "./src/index.html",
            }),
            new webpack.DefinePlugin({
                BUILD_DATE: JSON.stringify(date),
                COMMIT_HASH: JSON.stringify(commitHash),
                CONTRIBUTORS_LIST: JSON.stringify(contributorsList),
            }),
            ...(isProduction ? [
                new HtmlInlineScriptPlugin({
                    scriptMatchPattern: ['^bundle.js$'],
                }),
                new WorkboxPlugin.GenerateSW({
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
                })
            ] : []),
            ...(!isProduction ? [new ReactRefreshWebpackPlugin()] : [])
        ],

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
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
                                modules: "icss",
                            },
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                // Prefer `dart-sass`
                                implementation: sass,
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|jpg|gif|woff|ico)$/,
                    type: 'asset/resource'
                },
            ],
        },

        experiments: {
            syncWebAssembly: true,
            topLevelAwait: true,
        },

        mode: isProduction ? "production" : "development",
    };
};
