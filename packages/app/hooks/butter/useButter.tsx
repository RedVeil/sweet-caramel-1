import { ISetToken, ISetToken__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useButter(): ISetToken {
  const { library, contractAddresses, account, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId)) {
      return ISetToken__factory.connect(contractAddresses.butter, account ? library.getSigner() : library);
    }
  }, [library, contractAddresses.butter, account]);
}
