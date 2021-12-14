import { hideGlobalLoader, showGlobalLoader } from '../actions';
import { ChainId, logos } from './connectors';

declare global {
  interface Window {
    ethereum: any;
  }
}

export const switchNetwork = async (
  chainId: number,
  dispatch: React.Dispatch<any>,
) => {
  dispatch(showGlobalLoader());
  await (async (chainId) => {
    try {
      switch (chainId) {
        case ChainId.Ethereum:
          return connectToEthereumMainnet();
        case ChainId.Rinkeby:
          return connectToEthereumRinkeby();
        case ChainId.Polygon:
          return connectToMaticMainnet();
        case ChainId.Arbitrum:
          return connectToArbitrum();
        case ChainId.Localhost:
          return connectToLocalhost();
        case ChainId.Hardhat:
          return connectToHardhat();
      }
    } catch (e) {
      console.error('Error while changing network', e);
      dispatch(hideGlobalLoader());
    }
  })(chainId);
  dispatch(hideGlobalLoader());
};

export const connectToEthereumMainnet = async () => {
  await window.ethereum?.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x1' }],
  });
};

export const connectToLocalhost = async () => {
  await window.ethereum?.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x7a69' }],
  });
};

export const connectToHardhat = async () => {
  await window.ethereum?.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x7a69' }],
  });
};

export const connectToEthereumRinkeby = async () => {
  await window.ethereum?.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x4' }],
  });
};

export const connectToMaticMainnet = async () => {
  await window.ethereum?.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: '0x89',
        rpcUrls: ['https://rpc-mainnet.matic.network'],
        chainName: 'Matic(Polygon) Mainnet',
        nativeCurrency: {
          name: 'Matic',
          symbol: 'MATIC',
          decimals: 18,
        },
        blockExplorerUrls: ['https://polygonscan.com'],
      },
    ],
  });
};
export const connectToMaticMumbai = async () => {
  await window.ethereum?.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: '0x13881',
        rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
        chainName: 'Matic Mumbai',
        nativeCurrency: {
          name: 'Matic',
          symbol: 'MATIC',
          decimals: 18,
        },
        blockExplorerUrls: ['https://mumbai.polygonscan.com'],
      },
    ],
  });
};
export const connectToArbitrum = async () => {
  await window.ethereum?.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: '0xA4B1',
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        chainName: 'Arbitrum One',
        nativeCurrency: {
          name: 'AETH',
          symbol: 'AETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://arbiscan.io'],
      },
    ],
  });
};

export const getChainLogo = (chainId: number) => {
  return logos[chainId];
};
