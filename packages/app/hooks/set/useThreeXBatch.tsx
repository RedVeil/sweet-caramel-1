import { ThreeXBatchProcessing, ThreeXBatchProcessing__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useThreeXBatch(rpcProvider?): ThreeXBatchProcessing {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId))
      return ThreeXBatchProcessing__factory.connect(contractAddresses.threeXBatch, rpcProvider ? rpcProvider : signerOrProvider);
  }, [signerOrProvider, contractAddresses.threeXBatch, account]);
}
