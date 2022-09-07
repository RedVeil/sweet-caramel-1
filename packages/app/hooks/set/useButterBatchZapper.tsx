import { ButterBatchProcessingZapper, ButterBatchProcessingZapper__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useButterBatchZapper(rpcProvider?): ButterBatchProcessingZapper {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (contractAddresses?.butterBatchZapper && isButterSupportedOnCurrentNetwork(chainId))
      return ButterBatchProcessingZapper__factory.connect(contractAddresses.butterBatchZapper, rpcProvider ? rpcProvider : signerOrProvider);
  }, [signerOrProvider, contractAddresses.butterBatchZapper, account]);
}
