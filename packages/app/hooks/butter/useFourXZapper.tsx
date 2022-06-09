import { FourXZapper, FourXZapper__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useFourXZapper(): FourXZapper {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId))
      return FourXZapper__factory.connect(contractAddresses.fourXZapper, signerOrProvider);
  }, [signerOrProvider, contractAddresses.fourXZapper, account]);
}
