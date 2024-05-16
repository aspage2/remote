const BundlePlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "remote.js",
    path: path.join(__dirname, "dist"),
  },
  plugins: [
    new BundlePlugin({openAnalyzer: false}),
  ],
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["lodash"],
          },
        },
      },
      {
        test: /\.s[ac]ss/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: "[name]__[local]___[hash:base64:5]",
            },
          },
          {
            loader: "sass-loader",
          },
        ],
      },
      {
        test: /\.css/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|txt)/,
        use: ["file-loader"],
      },
      {
        test: /\.svg/,
        use: ["react-svg-loader"],
      },
    ],
  },
};
