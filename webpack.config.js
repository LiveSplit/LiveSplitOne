module.exports = async (env, argv) => {
    const HtmlWebpackPlugin = require("html-webpack-plugin");
    const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
    const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
    const { CleanWebpackPlugin } = require("clean-webpack-plugin");
    const WorkboxPlugin = require("workbox-webpack-plugin");
    const webpack = require("webpack");
    const { execSync } = require("child_process");
    const fetch = require("node-fetch");
    const moment = require("moment");
    const path = require("path");

    const getContributorsForRepo = async (repoName) => {
        const contributorsData = await fetch(`https://api.github.com/repos/LiveSplit/${repoName}/contributors`);
        return contributorsData.json();
    }

    const lsoContributorsList = await getContributorsForRepo("LiveSplitOne");
    const coreContributorsList = await getContributorsForRepo("livesplit-core");

    const coreContributorsMap = {};
    for (const coreContributor of coreContributorsList) {
        if (coreContributor.type === "User") {
            coreContributorsMap[coreContributor.login] = coreContributor;
        }
    }

    for (let lsoContributor of lsoContributorsList) {
        const existingContributor = coreContributorsMap[lsoContributor.login];
        if (existingContributor) {
            existingContributor.contributions += lsoContributor.contributions;
        } else if (lsoContributor.type === "User") {
            coreContributorsMap[lsoContributor.login] = lsoContributor;
        }
    }

    const contributorsList = Object.values(coreContributorsMap)
        .sort((user1, user2) => user2.contributions - user1.contributions)
        .map((user) => user.login);
    const commitHash = execSync("git rev-parse --short HEAD").toString();
    const date = moment.utc().format("YYYY-MM-DD kk:mm:ss");

    const basePath = __dirname;

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
            static: {
                directory: path.join(basePath, "src"),
            },
            port: 8080,
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
                new HtmlInlineScriptPlugin(['bundle.js']),
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
        ],

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
                        "ts-loader",
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
                                implementation: require("sass"),
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
