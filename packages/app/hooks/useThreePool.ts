import { isAddress } from "@ethersproject/address";
import { Curve3Pool, Curve3Pool__factory } from "@popcorn/hardhat/typechain";
import useWeb3 from "hooks/useWeb3";
import { useCallback } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useThreePool(): SWRResponse<Curve3Pool, Error> {
  const { library, contractAddresses, account, chainId } = useWeb3();

  const getThreePoolContract = useCallback(() => {
    if (isAddress(contractAddresses?.butterDependency?.threePool))
      return Curve3Pool__factory.connect(contractAddresses?.butterDependency?.threePool, library);
  }, [chainId, account, library, contractAddresses?.butterDependency?.threePool]);

  const shouldFetch = !!contractAddresses && contractAddresses?.butterDependency?.threePool;

  return useSWR(
    shouldFetch ? [`threePool`, contractAddresses?.butterDependency?.threePool, chainId, account, library] : null,
    async (key) => {
      return getThreePoolContract();
    },
  );
}
