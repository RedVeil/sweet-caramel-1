import { ButterBatchProcessing, ButterBatchProcessing__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useButterBatch(rpcProvider?): ButterBatchProcessing {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (contractAddresses?.butterBatch && isButterSupportedOnCurrentNetwork(chainId))
      return ButterBatchProcessing__factory.connect(contractAddresses.butterBatch, rpcProvider ? rpcProvider : signerOrProvider);
  }, [signerOrProvider, contractAddresses.butterBatch, account]);
}
