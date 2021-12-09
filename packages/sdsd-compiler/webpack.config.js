const path = require("path");
const nodeExternals = require("webpack-node-externals");
const DeclarationBundlerPlugin = require("types-webpack-bundler");

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
  devtool: "inline-source-map",
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
  plugins: [
    new DeclarationBundlerPlugin({
      moduleName: '"sdsd-compiler"',
      out: "sdsd-compiler.d.ts",
    }),
  ],
};

module.exports = config;
