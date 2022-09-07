import { ISetToken, ISetToken__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useButter(): ISetToken {
  const { signerOrProvider, contractAddresses, chainId } = useWeb3();

  return useMemo(() => {
    if (contractAddresses?.butter && isButterSupportedOnCurrentNetwork(chainId)) {
      return ISetToken__factory.connect(contractAddresses.butter, signerOrProvider);
    }
  }, [signerOrProvider, contractAddresses.butter]);
}
