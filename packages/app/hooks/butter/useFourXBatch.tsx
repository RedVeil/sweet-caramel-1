import { FourXBatchProcessing, FourXBatchProcessing__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useFourXBatch(): FourXBatchProcessing {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId))
      return FourXBatchProcessing__factory.connect(contractAddresses.fourXBatch, signerOrProvider);
  }, [signerOrProvider, contractAddresses.fourXBatch, account]);
}
