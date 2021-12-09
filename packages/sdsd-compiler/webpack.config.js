const path = require("path");
const nodeExternals = require("webpack-node-externals");

/** @type {import('webpack').Configuration}*/
const config = {
  target: "node",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "sdsd-compiler.js",
    library: {
      type: "commonjs",
    },
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: [".ts", ".js", ".ne"],
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ne$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
          "nearley-loader",
        ],
      },
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
};

module.exports = config;
