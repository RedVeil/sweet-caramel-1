import { connectors } from 'context/Web3/connectors';

export default function activateRPCNetwork(activate: Function): void {
  let targetChainId: number;
  let savedChainId = localStorage.getItem('chainId');
  if (savedChainId) {
    targetChainId = Number(savedChainId);
    localStorage.removeItem('chainId');
  } else {
    targetChainId = +process.env.CHAIN_ID;
  }
  activate(connectors.Network(targetChainId));
}
