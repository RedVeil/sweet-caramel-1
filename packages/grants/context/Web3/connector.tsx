import { RPC_URLS, supportedChainIds } from "@popcorn/utils";
import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";

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