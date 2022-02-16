import { Staking } from "@popcorn/hardhat/typechain";
import { getStakingPool } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";
import { ContractAddresses, StakingPool } from "../../../utils/src/types";

export default function useGetMultipleStakingPools(stakingContracts: Staking[]): SWRResponse<StakingPool[], Error> {
  const { library, account, chainId, contractAddresses } = useWeb3();
  const shouldFetch = !!stakingContracts && !!chainId;
  const stakingContractsMemoized = useMemo(() => stakingContracts, [chainId, account, library]);

  return useSWR(
    shouldFetch ? ["getPoolInfos", account, stakingContractsMemoized, contractAddresses, chainId] : null,
    async (
      key: string,
      account: string,
      stakingContracts: Staking[],
      contractAddresses: ContractAddresses,
      chainId: number,
    ) =>
      await Promise.all(
        stakingContracts.map(
          async (contract) => await getStakingPool(key, account, contract, contractAddresses, chainId, library),
        ),
      ),
    {
      refreshInterval: 2000,
    },
  );
}
