module.exports = (env, argv) => {
    const HtmlWebpackPlugin = require("html-webpack-plugin");
    const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
    const { CleanWebpackPlugin } = require("clean-webpack-plugin");
    const WorkboxPlugin = require("workbox-webpack-plugin");
    const path = require("path");

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
        },

        devtool: isProduction ? undefined : "source-map",

        devServer: {
            contentBase: basePath,
            compress: true,
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
                    icons: {
                        coast: false,
                        yandex: false,
                    },
                },
            }),
            new HtmlWebpackPlugin({
                template: "./src/index.html",
            }),
            ...(isProduction ? [new WorkboxPlugin.GenerateSW({
                clientsClaim: true,
                skipWaiting: true,
                maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
            })] : []),
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
                    test: /\.(s*)css$/,
                    use: ["style-loader", "css-loader", {
                        loader: "sass-loader",
                        options: {
                            // Prefer `dart-sass`
                            implementation: require("sass"),
                        },
                    }],
                },
                {
                    test: /\.(png|jpg|gif|woff|ico)$/,
                    use: [
                        {
                            loader: "url-loader",
                            options: {
                                limit: 8192,
                            },
                        },
                    ],
                },
            ],
        },

        node: {
            fs: "empty",
        },

        mode: isProduction ? "production" : "development",
    };
};
