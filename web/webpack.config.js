const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");
const { DefinePlugin } = require("webpack");


module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "remote.js",
    path: path.join(__dirname, "dist"),
  },
  optimization: {
    minimizer: [new TerserPlugin()],
  },
	plugins: [
		new DefinePlugin({
			__VERSION__: JSON.stringify(
				process.env.FRONTEND_VERSION || "dev"
			),
		}),
	],
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
