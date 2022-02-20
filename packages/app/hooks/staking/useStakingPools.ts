import { Staking__factory } from "@popcorn/hardhat/typechain";
import { getStakingPool } from "@popcorn/utils";
import { StakingPoolMetadata } from "@popcorn/utils/getStakingPool";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useStakingPools(addresses: string[] = []): SWRResponse<StakingPoolMetadata[], Error> {
  const { library, chainId, contractAddresses, account } = useWeb3();

  const stakingContracts = useMemo(
    () =>
      (addresses as string[]).map((address) =>
        Staking__factory.connect(address, account ? library.getSigner() : library),
      ),
    [chainId, addresses, account, library],
  );

  const shouldFetch = !!stakingContracts && !!chainId && !addresses.some((address) => !contractAddresses.has(address));

  return useSWR(
    shouldFetch ? [`getPoolInfo`, account, chainId, addresses] : null,
    async (key: string, account: string, chainId: number, addresses) => {
      return Promise.all(
        stakingContracts.map(
          async (contract) => await getStakingPool(key, account, contract, contractAddresses, chainId, library),
        ),
      );
    },
    { refreshInterval: 2000 },
  );
}
