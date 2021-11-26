import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';

export const networkMap = {
  1: 'Ethereum',
  4: 'rinkeby',
  42161: 'arbitrum one',
  80001: 'polygon_mumbai',
  137: 'polygon',
  1337: 'localhost',
  31337: 'hardhat',
};

const RPC_URLS = {
  1: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  4: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  42161: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  137: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  80001: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  31337: `http://localhost:8545`,
  1337: `http://localhost:8545`,
};

const Injected = new InjectedConnector({
  supportedChainIds: [1, 4, 42161, 80001, 137, 31337, 1337],
});

const Network = new NetworkConnector({
  urls: {
    1: RPC_URLS[1],
    4: RPC_URLS[4],
    42161: RPC_URLS[42161],
    80001: RPC_URLS[80001],
    137: RPC_URLS[137],
    31337: RPC_URLS[31337],
    1337: RPC_URLS[1337],
  },
  defaultChainId: +process.env.CHAIN_ID,
});

export const connectors = { Injected, Network };
