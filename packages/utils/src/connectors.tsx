import { ethers } from "ethers";

export enum ChainId {
  Ethereum = 1,
  Rinkeby = 4,
  Arbitrum = 42161,
  Mumbai = 80001,
  Polygon = 137,
  Hardhat = 1337,
  Localhost = 1337,
  BNB = 56,
  RemoteFork = 31338,
  Optimism = 10,
  ALL = "All",
}

export enum ChainIdHex {
  Ethereum = "0x1",
  Rinkeby = "0x4",
  Arbitrum = "0xa4b1",
  Mumbai = "0x13881",
  Polygon = "0x89",
  Localhost = "0x7a69",
  Hardhat = "0x539",
  BNB = "0x38",
  Optimism = "0xa",
}

export const HexToChain = {
  "0x1": ChainId.Ethereum,
  "0x4": ChainId.Rinkeby,
  "0xa4b1": ChainId.Arbitrum,
  "0x13881": ChainId.Mumbai,
  "0x89": ChainId.Polygon,
  "0x7a69": ChainId.Localhost,
  "0x539": ChainId.Hardhat,
  "0x38": ChainId.BNB,
  "0xa": ChainId.Optimism,
};

export const supportedChainIds = [
  ChainId.Ethereum,
  ChainId.Rinkeby,
  ChainId.Arbitrum,
  ChainId.Polygon,
  ChainId.Mumbai,
  ChainId.Localhost,
  ChainId.BNB,
  ChainId.Hardhat,
  ChainId.RemoteFork,
  ChainId.Optimism,
  ChainId.ALL,
];

export const networkMap = {
  [ChainId.Ethereum]: "Ethereum",
  [ChainId.Rinkeby]: "Rinkeby",
  [ChainId.Arbitrum]: "Arbitrum",
  [ChainId.Mumbai]: "polygon_mumbai",
  [ChainId.Polygon]: "Polygon",
  [ChainId.Hardhat]: "Hardhat",
  [ChainId.Localhost]: "Localhost",
  [ChainId.RemoteFork]: "RemoteFork",
  [ChainId.Optimism]: "Optimism",
  [ChainId.BNB]: "BNB",
  [ChainId.ALL]: "All Networks",
};

export const networkLogos = {
  [ChainId.ALL]: "/images/icons/allIcon.svg",
  [ChainId.Ethereum]: "/images/icons/ethereum.svg",
  [ChainId.Rinkeby]: "/images/icons/ethLogo.png",
  [ChainId.Polygon]: "/images/icons/polygon.svg",
  [ChainId.Arbitrum]: "/images/icons/arbitrum.svg",
  [ChainId.Localhost]: "/images/icons/testNetLogo.png",
  [ChainId.Hardhat]: "/images/icons/testNetLogo.png",
  [ChainId.RemoteFork]: "/images/icons/testNetLogo.png",
  [ChainId.Optimism]: "/images/icons/optimism-op-logo.svg",
  [ChainId.BNB]: "/images/icons/bsc-logo.png",
};
export const RPC_URLS = {
  [ChainId.Ethereum]: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Rinkeby]: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Arbitrum]: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Polygon]: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Mumbai]: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.BNB]: `https://bsc-dataseed1.binance.org`,
  [ChainId.Localhost]: `http://localhost:8545`,
  [ChainId.Hardhat]: `http://localhost:8545`,
  [ChainId.RemoteFork]: `http://localhost:8545`,
};
export const PRC_PROVIDERS = {
  [ChainId.Ethereum]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Ethereum], ChainId.Ethereum),
  [ChainId.Rinkeby]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Rinkeby], ChainId.Rinkeby),
  [ChainId.Arbitrum]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Arbitrum], ChainId.Arbitrum),
  [ChainId.Polygon]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Polygon], ChainId.Polygon),
  [ChainId.Mumbai]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Mumbai], ChainId.Mumbai),
  [ChainId.BNB]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.BNB], ChainId.BNB),
  [ChainId.Localhost]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Localhost], ChainId.Localhost),
  [ChainId.Hardhat]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Hardhat], ChainId.Hardhat),
  [ChainId.RemoteFork]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.RemoteFork], ChainId.RemoteFork),
};

export type HardhatConfigNetworks = {
  mainnet?: string;
  rinkeby?: string;
  bsc?: string;
  polygon?: string;
  hardhat?: string;
  arbitrum?: string;
  localhost?: string;
  remote_fork?: string;
};

export const HardhatConfigNetworksChainIdMapping = {
  mainnet: ChainId.Ethereum,
  ethereum: ChainId.Ethereum,
  rinkeby: ChainId.Rinkeby,
  bsc: ChainId.BNB,
  bnb: ChainId.BNB,
  polygon: ChainId.Polygon,
  hardhat: ChainId.Hardhat,
  localhost: ChainId.Localhost,
  arbitrum: ChainId.Arbitrum,
  remote_fork: ChainId.RemoteFork,
};
