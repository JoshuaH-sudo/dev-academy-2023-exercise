const { merge } = require("webpack-merge")
const common_webpack = require("./webpack.common")

module.exports = merge(common_webpack, {
  mode: "development",
  devtool: "inline-source-map",
})
