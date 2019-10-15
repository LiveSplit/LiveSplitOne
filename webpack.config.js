module.exports = (env, argv) => {
    const HtmlWebpackPlugin = require("html-webpack-plugin");
    const CopyWebpackPlugin = require("copy-webpack-plugin");
    const WebpackPwaManifest = require("webpack-pwa-manifest");
    const { CleanWebpackPlugin } = require("clean-webpack-plugin");
    const path = require("path");

    const basePath = __dirname;

    const isProduction = argv.mode === "production";
    const distPath = path.join(basePath, "dist");

    return {
        entry: {
            "bundle": ["babel-polyfill", "whatwg-fetch", "./src/index.tsx"],
        },
        output: {
            filename: "[name].js",
            path: distPath,
        },

        // Enable sourcemaps for debugging webpack's output.
        devtool: isProduction ? undefined : "source-map",

        devServer: {
            contentBase: basePath,
            compress: true,
            port: 8080,
        },

        resolve: {
            extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".json"],
        },

        plugins: [
            ...(isProduction ? [new CleanWebpackPlugin()] : []),
            new HtmlWebpackPlugin({
                template: "./src/index.html",
            }),
            ...(isProduction ? [new WebpackPwaManifest({
                name: "LiveSplit One",
                short_name: "LiveSplit One",
                start_url: ".",
                display: "standalone",
                background_color: "#171717",
                description: "A version of LiveSplit that works on a lot of platforms.",
                icons: [
                    {
                        src: path.resolve("src/assets/icon.png"),
                        sizes: [96, 128, 192, 256, 384, 512],
                    },
                ],
            })] : []),
            new CopyWebpackPlugin([
                { from: "src/livesplit_core.wasm", to: "livesplit_core.wasm" },
            ], {}),
        ],

        module: {
            rules: [
                // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
                {
                    test: /\.tsx?$/,
                    use: [
                        "babel-loader",
                        "ts-loader",
                    ],
                    exclude: "/node_modules",
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
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

            // preLoaders: [
            //     // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            //     { test: /\.js$/, loader: "source-map-loader" }
            // ],
        },

        node: {
            fs: "empty",
        },

        mode: isProduction ? "production" : "development",

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        // This is important because it allows us to avoid bundling all of our
        // dependencies, which allows browsers to cache those libraries between builds.
        // externals: {
        //     "react": "React",
        //     "react-dom": "ReactDOM",
        // },
    };
};
