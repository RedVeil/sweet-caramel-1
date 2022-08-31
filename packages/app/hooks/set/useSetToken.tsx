import { ISetToken, ISetToken__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function useSetToken(tokenAddress: string, rpcProvider?): ISetToken {
  const { signerOrProvider, chainId } = useWeb3();

  return useMemo(() => {
    if (tokenAddress && isButterSupportedOnCurrentNetwork(chainId)) {
      return ISetToken__factory.connect(tokenAddress, rpcProvider ? rpcProvider : signerOrProvider);
    }
  }, [signerOrProvider, tokenAddress]);
}