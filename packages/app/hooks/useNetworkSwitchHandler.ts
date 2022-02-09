import { useWeb3React } from "@web3-react/core";
import activateRPCNetwork from "helper/activateRPCNetwork";
import { useEffect } from "react";
import useNetworkSwitch from "./useNetworkSwitch";

export default function useNetworkSwitchHandler() {
  const { chainId, account, active, activate } = useWeb3React();
  const networkSwitch = useNetworkSwitch();

  useEffect(() => {
    if (!active && Number(localStorage.getItem("chainId"))) {
      activateRPCNetwork(activate, Number(localStorage.getItem("chainId")));
    }
  }, [active]);

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
