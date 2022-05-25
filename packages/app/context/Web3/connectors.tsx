import { ethers } from "@popcorn/hardhat/node_modules/ethers/lib";

export enum ChainId {
  Ethereum = 1,
  Rinkeby = 4,
  Arbitrum = 42161,
  Mumbai = 80001,
  Polygon = 137,
  Localhost = 1337,
  Hardhat = 31337,
  BinanceSmartChain = 56,
  Goerli = 5,
  BNB = 56,
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
}

export const supportedChainIds = [
  ChainId.Ethereum,
  ChainId.Rinkeby,
  ChainId.Arbitrum,
  ChainId.Polygon,
  ChainId.Mumbai,
  ChainId.Localhost,
  ChainId.BNB,
  ChainId.Goerli,
  ChainId.BinanceSmartChain
];

export const networkMap = {
  [ChainId.Ethereum]: "Ethereum",
  [ChainId.Rinkeby]: "Rinkeby",
  [ChainId.Arbitrum]: "Arbitrum",
  [ChainId.Mumbai]: "polygon_mumbai",
  [ChainId.Polygon]: "Polygon",
  [ChainId.Hardhat]: "Hardhat",
  [ChainId.Localhost]: "Localhost",
  [ChainId.BinanceSmartChain]: "BSC",
  [ChainId.Goerli]: "Goerli",
  [ChainId.BNB]: "BNB",
};

export const logos = {
  [ChainId.Ethereum]: "/images/icons/ethLogo.png",
  [ChainId.Rinkeby]: "/images/icons/ethLogo.png",
  [ChainId.Polygon]: "/images/icons/polygonLogo.png",
  [ChainId.Arbitrum]: "/images/icons/arbitrum.png",
  [ChainId.Localhost]: "/images/icons/ethLogo.png",
  [ChainId.BinanceSmartChain]: "/images/icons/bsc-logo.png",
  [ChainId.Goerli]: "/images/icons/ethLogo.png",
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
  [ChainId.Goerli]: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
};

// const Injected = new InjectedConnector({
//   supportedChainIds,
// });

// const Network = (chainId: number) => {
//   return new NetworkConnector({
//     urls: RPC_URLS,
//     defaultChainId: chainId,
//   });
// };

// export const Walletconnect = new WalletConnectConnector({
//   rpc: RPC_URLS,
//   chainId: 1,
//   bridge: "https://bridge.walletconnect.org",
//   qrcode: true,
//   supportedChainIds,
// });

// export const connectors = { Injected, Network, Walletconnect };

// export const supportedWallets = [Wallets.METAMASK, Wallets.WALLETCONNECT];

// export const walletToConnector = {
//   [Wallets.METAMASK]: connectors.Injected,
//   [Wallets.WALLETCONNECT]: connectors.Walletconnect,
// };

// export const walletToName = {
//   [Wallets.METAMASK]: "Injected",
//   [Wallets.WALLETCONNECT]: "WalletConnect",
// };

// export const walletToLogo = {
//   [Wallets.METAMASK]: "/images/wallets/metamask.svg",
//   [Wallets.WALLETCONNECT]: "/images/wallets/walletConnect.svg",
export const PRC_PROVIDERS = {
  [ChainId.Ethereum]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Ethereum], ChainId.Ethereum),
  [ChainId.Rinkeby]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Rinkeby], ChainId.Rinkeby),
  [ChainId.Arbitrum]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Arbitrum], ChainId.Arbitrum),
  [ChainId.Polygon]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Polygon], ChainId.Polygon),
  [ChainId.Mumbai]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Mumbai], ChainId.Mumbai),
  [ChainId.BNB]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.BNB], ChainId.BNB),
  [ChainId.Localhost]: new ethers.providers.JsonRpcProvider(RPC_URLS[ChainId.Localhost], ChainId.Localhost),
};
