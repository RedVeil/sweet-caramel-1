const { join } = require('path');

require('../utils/src/envLoader');

const workspace = join(__dirname, '..');

module.exports = {
  target: 'serverless',
  env: {
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
    ADDR_STAKING: process.env.ADDR_STAKING,
    ADDR_POP: process.env.ADDR_POP,
    ADDR_GRANT_REGISTRY: process.env.ADDR_GRANT_REGISTRY,
    ADDR_BENEFICIARY_REGISTRY: process.env.ADDR_BENEFICIARY_REGISTRY,
    ADDR_BENEFICIARY_GOVERNANCE: process.env.ADDR_BENEFICIARY_GOVERNANCE,
    ADDR_GRANT_ELECTION: process.env.ADDR_GRANT_ELECTION,
    ADDR_PRIVATE_SALE: process.env.ADDR_PRIVATE_SALE,
    ADDR_USDC: process.env.ADDR_USDC,
    ADDR_TREASURY: process.env.ADDR_TREASURY,
    ADDR_BENEFICIARY_VAULT: process.env.ADDR_BENEFICIARY_VAULT,
    ADDR_REWARDS_MANAGER: process.env.ADDR_REWARDS_MANAGER,
    ADDR_UNISWAP_ROUTER: process.env.ADDR_UNISWAP_ROUTER,
    ADDR_3CRV: process.env.ADDR_3CRV,
    PINATA_API_SECRET: process.env.PINATA_API_SECRET,
    PINATA_API_KEY: process.env.PINATA_API_KEY,
    IPFS_URL: process.env.IPFS_URL,
    IPFS_GATEWAY_RETRIEVE: process.env.IPFS_GATEWAY_RETRIEVE,
    IPFS_GATEWAY_PIN_JSON: process.env.IPFS_GATEWAY_PIN_JSON,
    IPFS_GATEWAY_PIN: process.env.IPFS_GATEWAY_PIN,
    ADDR_HYSI: process.env.ADDR_HYSI,
    ADDR_BATCH_HYSI: process.env.ADDR_BATCH_HYSI,
    ADDR_BASIC_ISSUANCE_MODULE: process.env.ADDR_BASIC_ISSUANCE_MODULE,
    ADDR_TRI_POOL: process.env.ADDR_TRI_POOL,
    ADDR_DUSD_METAPOOL: process.env.ADDR_DUSD_METAPOOL,
    ADDR_FRAX_METAPOOL: process.env.ADDR_FRAX_METAPOOL,
    ADDR_USDN_METAPOOL: process.env.ADDR_USDN_METAPOOL,
    ADDR_UST_METAPOOL: process.env.ADDR_UST_METAPOOL,
    ADDR_YDUSD: process.env.ADDR_YDUSD,
    ADDR_YFRAX: process.env.ADDR_YFRAX,
    ADDR_YUSDN: process.env.ADDR_YUSDN,
    ADDR_YUST: process.env.ADDR_YUST,
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
