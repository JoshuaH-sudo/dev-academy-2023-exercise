const common_webpack = require("./webpack.common")
const { merge } = require('webpack-merge');
const zlib = require("zlib")
const CompressionPlugin = require("compression-webpack-plugin")

module.exports = merge(common_webpack, {
  mode: "production",
  plugins: [
    new CompressionPlugin({
      filename: "[path][base].br",
      exclude: ["@elastic"],
      algorithm: "brotliCompress",
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        },
      },
      threshold: 10240,
      minRatio: 0.8,
      deleteOriginalAssets: true,
    }),
  ]
})
