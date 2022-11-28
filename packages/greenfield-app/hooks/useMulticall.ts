import useProxy, { DS_PROXY_ABI } from "./useProxy";
import { useEffect, useState } from "react";
import { ProxyMultiCall } from "@popcorn/utils/MultiCallProxy";
import { usePrepareContractWrite, useContractWrite } from "wagmi";

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

const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// convience wrapper around `useContractWrite` for multicall execution
export function useWriteMulticall(bytes) {
  const { proxyAddress } = useProxy();

  const { config } = usePrepareContractWrite({
    address: proxyAddress,
    abi: DS_PROXY_ABI,
    functionName: "execute(address,bytes)",
    args: [MULTICALL_ADDRESS, bytes],
  });

  const { write, isLoading, isSuccess } = useContractWrite(config);

  return { write, isLoading, isSuccess };
}
