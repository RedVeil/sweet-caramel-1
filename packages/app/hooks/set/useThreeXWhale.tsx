import { ThreeXWhaleProcessing, ThreeXWhaleProcessing__factory } from "@popcorn/hardhat/typechain";
import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { useRpcProvider } from "hooks/useRpcProvider";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useThreeXWhale(address: string, chainId: ChainId): ThreeXWhaleProcessing {
  const { account } = useWeb3();

  const provider = useRpcProvider(chainId);
  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId) && !!address)
      return ThreeXWhaleProcessing__factory.connect(address, provider);
  }, [provider, address, chainId, account]);
}
