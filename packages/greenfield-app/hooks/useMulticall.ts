import useProxy from "./useProxy";
import { useEffect, useState } from "react";
import { ProxyMultiCall } from "@popcorn/utils/MultiCallProxy";

export default function useMulticall(targets) {
  const [pmc, setPmc] = useState();
  const { proxyAddress } = useProxy();

  useEffect(() => {
    if (targets && proxyAddress) {
      const _pmc = new ProxyMultiCall({
        proxyAddress: proxyAddress,
        targets: targets,
      });
      // @ts-ignore should use Contract from utils package
      setPmc(_pmc);
    }
  }, [proxyAddress]);

  return { pmc };
}
