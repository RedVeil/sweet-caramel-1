import { isAddress } from "@ethersproject/address";
import { BasicIssuanceModule, BasicIssuanceModule__factory } from "@popcorn/hardhat/typechain";
import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useCallback } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useBasicIssuanceModule(): SWRResponse<BasicIssuanceModule, Error> {
  const { library, contractAddresses, account, chainId } = useWeb3();

  const getBasicIssuanceModuleContract = useCallback(() => {
    if (isAddress(contractAddresses?.butterDependency?.setBasicIssuanceModule))
      return BasicIssuanceModule__factory.connect(contractAddresses?.butterDependency?.setBasicIssuanceModule, library);
  }, [chainId, account, library, contractAddresses?.butterDependency?.setBasicIssuanceModule]);

  const shouldFetch =
    !!contractAddresses &&
    contractAddresses?.butterDependency?.setBasicIssuanceModule &&
    isButterSupportedOnCurrentNetwork(chainId);
  return useSWR(
    shouldFetch
      ? [`basicIssuanceModule`, contractAddresses?.butterDependency?.setBasicIssuanceModule, chainId, account, library]
      : null,
    async (key) => {
      return getBasicIssuanceModuleContract();
    },
  );
}
