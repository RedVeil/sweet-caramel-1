const { join } = require("path");

require("../utils/src/envLoader");

const workspace = join(__dirname, "..");

module.exports = {
  reactStrictMode: true,
  target: "serverless",
  env: {
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
    INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
    IS_DEV: process.env.IS_DEV,
  },
  poweredByHeader: false,
  webpack: (config, options) => {
    /** Allows import modules from packages in workspace. */
    //config.externals = { ...config.externals, electron: 'electron' };
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: [workspace],
          exclude: /node_modules/,
          use: options.defaultLoaders.babel,
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: "@svgr/webpack",
              options: { svgo: false },
            },
            "file-loader",
          ],
        },
      ],
    };
    return config;
  },
};
