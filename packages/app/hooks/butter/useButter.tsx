import { isAddress } from "@ethersproject/address";
import { ISetToken, ISetToken__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useCallback } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useButter(): SWRResponse<ISetToken, Error> {
  const { library, contractAddresses, account, chainId } = useWeb3();

  const getButterContract = useCallback(() => {
    if (isAddress(contractAddresses.butter))
      return ISetToken__factory.connect(contractAddresses.butter, account ? library.getSigner() : library);
  }, [chainId, account, library, contractAddresses.butter]);

  const shouldFetch = !!contractAddresses && contractAddresses.butter && isButterSupportedOnCurrentNetwork(chainId);
  return useSWR(shouldFetch ? [`butter`, contractAddresses.butter, chainId, account, library] : null, async (key) => {
    return getButterContract();
  });
}
