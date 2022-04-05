import { connectors } from "context/Web3/connectors";
import activateRPCNetwork from "helper/activateRPCNetwork";
import { useEffect, useState } from "react";
import useWeb3 from "./useWeb3";

export default function useEagerConnect() {
  const { activate, account } = useWeb3();

  const [triedButFailed, setTried] = useState(false);

  useEffect(() => {
    async function handleEagerConnect() {
      const eagerConnect = localStorage.getItem("eager_connect");
      const cachedWallet = localStorage.getItem("cached_wallet");

      const isAuthorized = await connectors.Injected.isAuthorized();
      if (isAuthorized && eagerConnect === "true") {
        activate(connectors.Injected).catch(() => {
          setTried(true);
        });
      } else {
        activateRPCNetwork(activate, Number(localStorage.getItem("chainId")));
      }
    }

    handleEagerConnect();
  }, []); // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (!triedButFailed && account) {
      setTried(true);
    }
  }, [triedButFailed, account]);

  return triedButFailed;
}
