import { PopLocker, Staking } from '@popcorn/hardhat/typechain';
import { useWeb3React } from '@web3-react/core';
import {} from 'ethereumjs-util';
import { BigNumber } from 'ethers';
import useSWR from 'swr';
import useStakingPool from './useStakingPool';

const getStakingReward =
  () =>
  async (
    _: any,
    account: string,
    stakingPool: Staking | PopLocker,
    isPopLocker: boolean,
  ) => {
    if (isPopLocker) {
      const rewardRes = await (stakingPool as PopLocker)?.claimableRewards(
        account,
      );
      if (rewardRes === undefined || rewardRes?.length === 0) {
        return BigNumber.from('0');
      }
      return rewardRes[0].amount;
    }
    return await (stakingPool as Staking).earned(account);
  };

export default function useGetStakingReward(
  stakingPoolAddress: string,
  isPopLocker: boolean,
) {
  const { library, account, chainId } = useWeb3React();
  const stakingPool = useStakingPool(stakingPoolAddress);
  const shouldFetch = !!stakingPoolAddress && !!account;
  return useSWR(
    shouldFetch
      ? ['getStakingReward', account, stakingPool, isPopLocker]
      : null,
    getStakingReward(),
    {
      refreshInterval: 5000,
    },
  );
}
