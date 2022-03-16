import { isAddress } from "@ethersproject/address";
import { ButterBatchProcessingZapper, ButterBatchProcessingZapper__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useCallback } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useButterBatchZapper(): SWRResponse<ButterBatchProcessingZapper, Error> {
  const { library, contractAddresses, account, chainId } = useWeb3();

  const getButterBatchZapperContract = useCallback(() => {
    if (isAddress(contractAddresses.butterBatchZapper))
      return ButterBatchProcessingZapper__factory.connect(
        contractAddresses.butterBatchZapper,
        account ? library.getSigner() : library,
      );
  }, [chainId, account, library, contractAddresses.butterBatchZapper]);

  const shouldFetch =
    !!contractAddresses && !!contractAddresses.butterBatchZapper && isButterSupportedOnCurrentNetwork(chainId);
  return useSWR(
    shouldFetch ? [`butterBatchZapper`, contractAddresses.butterBatchZapper, chainId, account, library] : null,
    async (key) => {
      return getButterBatchZapperContract();
    },
  );
}
