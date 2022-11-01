const { join } = require("path");

require("../utils/src/envLoader");

const workspace = join(__dirname, "..");

const ChainId = {
  1: "ethereum",
  4: "rinkeby",
  42161: "arbitrum",
  80001: "mumbai",
  137: "polygon",
  1337: "localhost",
  31337: "hardhat",
  56: "bnb",
};
const defaultChain = ChainId[Number(process.env.CHAIN_ID)];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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

module.exports = nextConfig;
