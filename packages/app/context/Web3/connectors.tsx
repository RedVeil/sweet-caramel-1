import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';

export enum ChainId {
  Ethereum = 1,
  Rinkeby = 4,
  Arbitrum = 42161,
  Mumbai = 80001,
  Polygon = 137,
  Localhost = 1337,
  Hardhat = 31337,
}

export const networkMap = {
  [ChainId.Ethereum]: 'Ethereum',
  [ChainId.Rinkeby]: 'Rinkeby',
  [ChainId.Arbitrum]: 'Arbitrum',
  [ChainId.Mumbai]: 'polygon_mumbai',
  [ChainId.Polygon]: 'Polygon',
  [ChainId.Hardhat]: 'Hardhat',
  [ChainId.Localhost]: 'Localhost',
};

export const logos = {
  [ChainId.Ethereum]: '/images/icons/ethLogo.png',
  [ChainId.Rinkeby]: '/images/icons/ethLogo.png',
  [ChainId.Polygon]: '/images/icons/polygonLogo.png',
  [ChainId.Arbitrum]: '/images/icons/arbitrum.png',
  [ChainId.Localhost]: '/images/icons/ethLogo.png',
};

const RPC_URLS = {
  [ChainId.Ethereum]: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Rinkeby]: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Arbitrum]: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Polygon]: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Mumbai]: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  [ChainId.Localhost]: `http://localhost:8545`,
};

export const supportedChainIds = [
  ChainId.Ethereum,
  ChainId.Rinkeby,
  ChainId.Arbitrum,
  ChainId.Polygon,
  ChainId.Mumbai,
  ChainId.Localhost,
];

const Injected = new InjectedConnector({
  supportedChainIds,
});

const Network = (chainId: number) => {
  return new NetworkConnector({
    urls: RPC_URLS,
    defaultChainId: chainId,
  });
};

export const connectors = { Injected, Network: Network };
