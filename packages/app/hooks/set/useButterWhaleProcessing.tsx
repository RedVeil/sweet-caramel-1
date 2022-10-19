import { ButterWhaleProcessing, ButterWhaleProcessing__factory } from "@popcorn/hardhat/typechain";
import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";
import { useRpcProvider } from "../useRpcProvider";

export default function useButterWhaleProcessing(address: string, chainId: ChainId): ButterWhaleProcessing {
  const { account } = useWeb3();
  const provider = useRpcProvider(chainId);

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId) && !!address)
      return ButterWhaleProcessing__factory.connect(address, provider);
  }, [provider, address, account, chainId]);
}
