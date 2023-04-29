const zlib = require("zlib")
const { merge } = require("webpack-merge")
const CompressionPlugin = require("compression-webpack-plugin")
const common_webpack = require("./webpack.common")

module.exports = merge(common_webpack, {
  mode: "production",
  plugins: [
    new CompressionPlugin({
      filename: "[path][base].br",
      exclude: "@elastic/",
      algorithm: "brotliCompress",
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        },
      },
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],
})
