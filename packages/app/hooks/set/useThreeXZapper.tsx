import { ThreeXZapper, ThreeXZapper__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useThreeXZapper(rpcProvider?): ThreeXZapper {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId))
      return ThreeXZapper__factory.connect(contractAddresses.threeXZapper, rpcProvider ? rpcProvider : signerOrProvider);
  }, [signerOrProvider, contractAddresses.threeXZapper, account]);
}
