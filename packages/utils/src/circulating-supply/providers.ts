import { JsonRpcProvider } from "@ethersproject/providers";
require("../envLoader");

const {
  ALCHEMY_API_KEYS_ETHEREUM,
  ALCHEMY_API_KEYS_POLYGON,
  ALCHEMY_API_KEYS_ARBITRUM,
  ALCHEMY_API_KEYS_OPTIMISM,
  QUICK_NODE_API_KEYS,
} = process.env;

const config = {
  eth_base_url: "https://eth-mainnet.alchemyapi.io/v2/",
  poly_base_url: "https://polygon-mainnet.g.alchemy.com/v2/",
  arb_base_url: "https://arb-mainnet.g.alchemy.com/v2/",
  bnb_base_url: "https://withered-wild-feather.bsc.quiknode.pro/",
  op_base_url: "https://opt-mainnet.g.alchemy.com/v2/",
  eth_keys: ALCHEMY_API_KEYS_ETHEREUM?.split(","),
  arb_keys: ALCHEMY_API_KEYS_ARBITRUM?.split(","),
  poly_keys: ALCHEMY_API_KEYS_POLYGON?.split(","),
  op_keys: ALCHEMY_API_KEYS_OPTIMISM?.split(","),
  bnb_keys: QUICK_NODE_API_KEYS?.split(","),
};

export const PROVIDERS = {
  ethereum: [
    new JsonRpcProvider(`${config.eth_base_url}${config.eth_keys[0]}`),
    new JsonRpcProvider(`${config.eth_base_url}${config.eth_keys[1]}`),
  ],
  polygon: [
    new JsonRpcProvider(`${config.poly_base_url}${config.poly_keys[0]}`),
    new JsonRpcProvider(`${config.poly_base_url}${config.poly_keys[1]}`),
  ],
  arbitrum: [
    new JsonRpcProvider(`${config.arb_base_url}${config.arb_keys[0]}`),
    new JsonRpcProvider(`${config.arb_base_url}${config.arb_keys[1]}`),
  ],
  bnb: [
    new JsonRpcProvider(`${config.bnb_base_url}${config.bnb_keys[0]}/`),
    new JsonRpcProvider(`${config.bnb_base_url}${config.bnb_keys[1]}/`),
  ],
  optimism: [
    new JsonRpcProvider(`${config.op_base_url}${config.op_keys[0]}`),
    new JsonRpcProvider(`${config.op_base_url}${config.op_keys[1]}`),
  ],
};
