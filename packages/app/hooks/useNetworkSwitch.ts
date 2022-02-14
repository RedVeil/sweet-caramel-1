import { useWeb3React } from "@web3-react/core";
import { switchNetwork } from "context/Web3/networkSwitch";
import { useRouter } from "next/router";
import { useCallback } from "react";

export default function useNetworkSwitch() {
  const router = useRouter();
  const { account } = useWeb3React();

  return useCallback(
    (newChainId: number) => {
      if (typeof newChainId === "number") {
        if (account) {
          switchNetwork(newChainId);
        } else {
          localStorage.setItem("chainId", String(newChainId));
          // @Dev handle route specific behaviour here.
          // For route staking/[id] we need to redirect the user back to the staking pools page.
          if (router.pathname === "/staking/[id]") {
            router.push("/staking");
          }

          window.location.reload();
        }
      }
    },
    [router, account],
  );
}
