import { useWeb3React } from "@web3-react/core";
import { useEffect } from "react";
import useNetworkSwitch from "./useNetworkSwitch";

export default function useNetworkSwitchHandler() {
  const { chainId, account } = useWeb3React();
  const networkSwitch = useNetworkSwitch();

  useEffect(() => {
    if (!Number(localStorage.getItem("previousChainId"))) {
      localStorage.setItem("previousChainId", process.env.CHAIN_ID);
    }
  }, []);

  useEffect(() => {
    const previousChainId = Number(localStorage.getItem("previousChainId"));
    // checking Account and ChainId for changes
    if (chainId && !account) {
      // ChainId was changed without wallet connected
      localStorage.setItem("previousChainId", String(chainId));
    } else if (previousChainId && account && chainId !== previousChainId) {
      // ChainId was changed with walled connected
      localStorage.setItem("previousChainId", String(chainId));
      networkSwitch(chainId);
    }
  }, [chainId, account]);
}
