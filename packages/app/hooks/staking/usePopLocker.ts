import { PopLocker__factory } from "@popcorn/hardhat/typechain";
import { getPopLocker } from "@popcorn/utils";
import { PopLockerMetadata } from "@popcorn/utils/getStakingPool";
import { isAddress } from "ethers/lib/utils";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";
import useWeb3 from "../useWeb3";

export default function usePopLocker(address: string): SWRResponse<PopLockerMetadata, Error> {
  const { signerOrProvider, account, chainId, contractAddresses } = useWeb3();
  const popLocker = useMemo(
    () =>
      isAddress(address) &&
      contractAddresses.has(address) &&
      !!chainId &&
      !!signerOrProvider &&
      PopLocker__factory.connect(address, signerOrProvider),
    [chainId, address, signerOrProvider],
  );
  return useSWR(
    popLocker && contractAddresses.has(address) ? [`getPopLockerInfo`, address, chainId, account] : null,
    (key) => {
      return getPopLocker(key, popLocker, account);
    },
  );
}
