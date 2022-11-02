import { isAddress } from "@ethersproject/address";
import { Staking__factory } from "@popcorn/hardhat/typechain";
import { ChainId, getStakingPool } from "@popcorn/utils";
import { StakingPoolMetadata } from "@popcorn/utils/getStakingPool";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useMemo } from "react";
import useSWR, { SWRResponse } from "swr";

export default function useStakingPool(address: string, chainId: ChainId): SWRResponse<StakingPoolMetadata, Error> {
  const { account } = useWeb3();
  const provider = useRpcProvider(chainId);
  const contractAddresses = useDeployment(chainId);

  const stakingContract = useMemo(() => {
    if (isAddress(address)) return Staking__factory.connect(address, provider);
  }, [chainId, address, provider]);

  const shouldFetch = !!stakingContract;
  return useSWR(shouldFetch ? [address, chainId, account, provider, stakingContract] : null, async (key) => {
    return getStakingPool(key, account, stakingContract, chainId, provider, contractAddresses);
  });
}
