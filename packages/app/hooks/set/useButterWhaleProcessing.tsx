import { ButterWhaleProcessing, ButterWhaleProcessing__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useMemo } from "react";

export default function useButterWhaleProcessing(): ButterWhaleProcessing {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (contractAddresses?.butterWhaleProcessing && isButterSupportedOnCurrentNetwork(chainId))
      return ButterWhaleProcessing__factory.connect(contractAddresses.butterWhaleProcessing, signerOrProvider);
  }, [signerOrProvider, contractAddresses.butterWhaleProcessing, account]);
}
