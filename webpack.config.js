const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

const basePath = __dirname;
const distPath = path.join(basePath, "dist");

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
    entry: ["babel-polyfill", "whatwg-fetch", "./src/index.tsx"],
    output: {
        filename: "bundle.js",
        path: distPath,
    },

    // Enable sourcemaps for debugging webpack's output.
    // devtool: "source-map",

    devServer: {
        contentBase: basePath,
        compress: true,
        port: 8080,
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".json"],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
        }),
        new CopyWebpackPlugin([
            { from: "src/livesplit_core.wasm", to: "livesplit_core.wasm" },
        ], {}),
    ],

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                [
                                    "env",
                                    {
                                        targets: {
                                            uglify: isProduction,
                                        },
                                        forceAllTransforms: isProduction,
                                    },
                                ],
                            ],
                        },
                    },
                    "ts-loader",
                ],
                exclude: "/node_modules",
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpg|gif|woff)$/,
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

        // rules: [
        // ],

        // preLoaders: [
        //     // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        //     { test: /\.js$/, loader: "source-map-loader" }
        // ]
    },

    node: {
        fs: "empty",
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    // externals: {
    //     "react": "React",
    //     "react-dom": "ReactDOM",
    // },
};
