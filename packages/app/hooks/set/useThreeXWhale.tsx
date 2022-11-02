import { ThreeXWhaleProcessing, ThreeXWhaleProcessing__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useMemo } from "react";

export default function useThreeXWhale(): ThreeXWhaleProcessing {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId))
      return ThreeXWhaleProcessing__factory.connect(contractAddresses.threeXWhale, signerOrProvider);
  }, [signerOrProvider, contractAddresses.threeXWhale, account]);
}
