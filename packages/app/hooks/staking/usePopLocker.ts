import { PopLocker__factory } from "@popcorn/hardhat/typechain";
import { getPopLocker } from "@popcorn/utils";
import { PopLockerMetadata } from "@popcorn/utils/getStakingPool";
import { isAddress } from "ethers/lib/utils";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";
import useWeb3 from "../useWeb3";

export default function usePopLocker(address: string): SWRResponse<PopLockerMetadata, Error> {
  const { library, account, chainId, contractAddresses } = useWeb3();

  const popLocker = useMemo(
    () =>
      isAddress(address) &&
      contractAddresses.has(address) &&
      !!chainId &&
      !!library &&
      PopLocker__factory.connect(address, account ? library.getSigner() : library),
    [chainId, address, library],
  );
  return useSWR(
    popLocker && contractAddresses.has(address) ? [`getPopLockerInfo`, address, chainId, account] : null,
    (key, address, chainId, account: string) => {
      return getPopLocker(key, popLocker, account);
    },
  );
}
