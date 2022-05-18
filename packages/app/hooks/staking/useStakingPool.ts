import { isAddress } from "@ethersproject/address";
import { Staking__factory } from "@popcorn/hardhat/typechain";
import { getStakingPool } from "@popcorn/utils";
import { StakingPoolMetadata } from "@popcorn/utils/getStakingPool";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useStakingPool(address: string): SWRResponse<StakingPoolMetadata, Error> {
  const { signerOrProvider, contractAddresses, account, chainId } = useWeb3();

  const stakingContract = useMemo(() => {
    if (isAddress(address) && contractAddresses.has(address))
      return Staking__factory.connect(address, signerOrProvider);
  }, [chainId, account, signerOrProvider]);

  const shouldFetch = !!stakingContract && contractAddresses.has(address);
  return useSWR(shouldFetch ? [`staking-pool`, address, chainId, account] : null, async (key) => {
    return getStakingPool(key, account, stakingContract, contractAddresses, chainId, signerOrProvider);
  });
}
