import { isAddress } from "@ethersproject/address";
import { ButterBatchProcessing, ButterBatchProcessing__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useCallback } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useButterBatch(): SWRResponse<ButterBatchProcessing, Error> {
  const { library, contractAddresses, account, chainId } = useWeb3();

  const getButterBatchZapperContract = useCallback(() => {
    if (isAddress(contractAddresses.butterBatch))
      return ButterBatchProcessing__factory.connect(
        contractAddresses.butterBatch,
        account ? library.getSigner() : library,
      );
  }, [chainId, account, library, contractAddresses.butterBatch]);

  const shouldFetch =
    !!contractAddresses && !!contractAddresses.butterBatch && isButterSupportedOnCurrentNetwork(chainId);
  return useSWR(
    shouldFetch ? [`butterBatch`, contractAddresses.butterBatch, chainId, account, library] : null,
    async (key) => {
      return getButterBatchZapperContract();
    },
  );
}
