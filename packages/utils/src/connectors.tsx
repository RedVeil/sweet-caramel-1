import { ethers } from "ethers";

export enum ChainId {
  Ethereum = 1,
  Rinkeby = 4,
  Arbitrum = 42161,
  Mumbai = 80001,
  Polygon = 137,
  Localhost = 1337,
  Hardhat = 31337,
  BNB = 56,
  Goerli = 5
}

export enum ChainIdHex {
  Ethereum = "0x1",
  Rinkeby = "0x4",
  Arbitrum = "0xa4b1",
  Mumbai = "0x13881",
  Polygon = "0x89",
  Localhost = "0x539",
  Hardhat = "0x7a69",
  BNB = "0x38",
  Goerli = "0x5"
}

export const supportedChainIds = [
  ChainId.Ethereum,
  ChainId.Rinkeby,
  ChainId.Arbitrum,
  ChainId.Polygon,
  ChainId.Mumbai,
  ChainId.Localhost,
  ChainId.BNB,
  ChainId.Goerli
];

export const networkMap = {
  [ChainId.Ethereum]: "Ethereum",
  [ChainId.Rinkeby]: "Rinkeby",
  [ChainId.Arbitrum]: "Arbitrum",
  [ChainId.Mumbai]: "polygon_mumbai",
  [ChainId.Polygon]: "Polygon",
  [ChainId.Hardhat]: "Hardhat",
  [ChainId.Localhost]: "Localhost",
  [ChainId.BNB]: "BNB",
  [ChainId.Goerli]: "Goerli"
};

export const networkLogos = {
  [ChainId.Ethereum]: "/images/icons/ethLogo.png",
  [ChainId.Rinkeby]: "/images/icons/ethLogo.png",
  [ChainId.Polygon]: "/images/icons/polygonLogo.png",
  [ChainId.Arbitrum]: "/images/icons/arbitrum.png",
  [ChainId.Localhost]: "/images/icons/ethLogo.png",
  [ChainId.BNB]: "/images/icons/bsc-logo.png",
  [ChainId.Goerli]: "/images/icons/ethLogo.png",
};
export const RPC_URLS = {
  [ChainId.Ethereum]: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Rinkeby]: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Arbitrum]: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Polygon]: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Mumbai]: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.BNB]: `https://bsc-dataseed1.binance.org`,
  [ChainId.Localhost]: `http://localhost:8545`,
  [ChainId.Goerli]: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
};
export const PRC_PROVIDERS = {
  [ChainId.Ethereum]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Ethereum], ChainId.Ethereum),
  [ChainId.Rinkeby]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Rinkeby], ChainId.Rinkeby),
  [ChainId.Arbitrum]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Arbitrum], ChainId.Arbitrum),
  [ChainId.Polygon]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Polygon], ChainId.Polygon),
  [ChainId.Mumbai]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Mumbai], ChainId.Mumbai),
  [ChainId.BNB]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.BNB], ChainId.BNB),
  [ChainId.Localhost]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Localhost], ChainId.Localhost),
  [ChainId.Goerli]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Goerli], ChainId.Goerli),
};

export type HardhatConfigNetworks = {
  mainnet?: string;
  rinkeby?: string;
  bsc?: string;
  polygon?: string;
  hardhat?: string;
  arbitrum?: string;
  localhost?: string;
  goerli?: string;
};

export const HardhatConfigNetworksChainIdMapping = {
  mainnet: ChainId.Ethereum,
  rinkeby: ChainId.Rinkeby,
  bsc: ChainId.BNB,
  polygon: ChainId.Polygon,
  hardhat: ChainId.Localhost,
  localhost: ChainId.Localhost,
  arbitrum: ChainId.Arbitrum,
  goerli: ChainId.Goerli
};
