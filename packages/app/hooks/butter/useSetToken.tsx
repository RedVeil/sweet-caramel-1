import { ISetToken, ISetToken__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useSetToken(tokenAddress: string): ISetToken {
  const { signerOrProvider, chainId } = useWeb3();

  return useMemo(() => {
    if (isButterSupportedOnCurrentNetwork(chainId)) {
      return ISetToken__factory.connect(tokenAddress, signerOrProvider);
    }
  }, [signerOrProvider, tokenAddress]);
}
