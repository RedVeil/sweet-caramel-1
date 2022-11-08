import { Staking__factory } from "@popcorn/hardhat/typechain";
import { ChainId, getStakingPool } from "@popcorn/utils";
import { StakingPoolMetadata } from "@popcorn/utils/getStakingPool";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useGetMultipleStakingPools(
  addresses: string[] = [],
  chainId: ChainId,
): SWRResponse<StakingPoolMetadata[], Error> {
  const { signerOrProvider, account } = useWeb3();
  const contractAddresses = useDeployment(chainId);

  const stakingContracts = useMemo(
    () => addresses.map((address) => Staking__factory.connect(address, signerOrProvider)),
    [chainId, addresses, signerOrProvider],
  );

  const shouldFetch = !!stakingContracts && !!chainId;

  return useSWR(
    shouldFetch ? [`getPoolInfo`, account, chainId, addresses, signerOrProvider] : null,
    async (key: string) => {
      return Promise.all(
        stakingContracts.map(async (contract) =>
          getStakingPool(key, account, contract, chainId, signerOrProvider, contractAddresses),
        ),
      );
    },
  );
}
