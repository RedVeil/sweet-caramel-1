import { ButterBatchProcessingZapper, ButterBatchProcessingZapper__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useButterBatchZapper(): ButterBatchProcessingZapper {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId))
      return ButterBatchProcessingZapper__factory.connect(contractAddresses.butterBatchZapper, signerOrProvider);
  }, [signerOrProvider, contractAddresses.butterBatchZapper, account]);
}
