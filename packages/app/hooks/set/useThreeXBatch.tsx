import { ThreeXBatchProcessing, ThreeXBatchProcessing__factory } from "@popcorn/hardhat/typechain";
import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { isAddress } from "ethers/lib/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";
import { useRpcProvider } from "../useRpcProvider";

export default function useThreeXBatch(address: string | undefined, chainId: ChainId): ThreeXBatchProcessing {
  const { account } = useWeb3();
  const provider = useRpcProvider(chainId);

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId) && isAddress(address))
      return ThreeXBatchProcessing__factory.connect(address, provider);
  }, [provider, address, account, chainId]);
}
