const { join } = require("path");

require("../utils/src/envLoader");

const workspace = join(__dirname, "..");

module.exports = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: ["popcorn.mypinata.cloud"],
  },
  env: {
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
    PINATA_API_SECRET: process.env.PINATA_API_SECRET,
    PINATA_API_KEY: process.env.PINATA_API_KEY,
    IPFS_URL: process.env.IPFS_URL,
    IPFS_GATEWAY_RETRIEVE: process.env.IPFS_GATEWAY_RETRIEVE,
    IPFS_GATEWAY_PIN_JSON: process.env.IPFS_GATEWAY_PIN_JSON,
    IPFS_GATEWAY_PIN: process.env.IPFS_GATEWAY_PIN,
    INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
    GRANTS_BASE_URL: process.env.GRANTS_BASE_URL,
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
      ],
    };
    return config;
  },
};
