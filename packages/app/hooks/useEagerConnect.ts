import { useWeb3React } from "@web3-react/core";
import { connectors } from "context/Web3/connectors";
import activateRPCNetwork from "helper/activateRPCNetwork";
import { useEffect, useState } from "react";

export default function useEagerConnect() {
  const { activate, active } = useWeb3React();

  const [triedButFailed, setTried] = useState(false);

  useEffect(() => {
    async function handleEagerConnect() {
      const eagerConnect = localStorage.getItem("eager_connect");

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
    if (!triedButFailed && active) {
      setTried(true);
    }
  }, [triedButFailed, active]);

  return triedButFailed;
}
