import { ButterBatchProcessing, ButterBatchProcessing__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useButterBatch(): ButterBatchProcessing {
  const { library, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId))
      return ButterBatchProcessing__factory.connect(
        contractAddresses.butterBatch,
        account ? library.getSigner() : library,
      );
  }, [library, contractAddresses.butterBatch, account]);
}
