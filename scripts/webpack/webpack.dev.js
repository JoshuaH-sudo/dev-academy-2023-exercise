const common_webpack = require("./webpack.common")
const { merge } = require("webpack-merge")

module.exports = merge(common_webpack, {
  mode: "development",
  devtool: "inline-source-map",
})
