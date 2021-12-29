import type { TransactionResponse } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useCallback } from 'react';
import { PopLocker, Staking } from '../../hardhat/typechain';

export type StakingPool = {
  address: string;
  pool: Staking;
};

export default function useClaimStakingReward() {
  const { library, account, chainId } = useWeb3React();
  return useCallback(
    async (
      stakingPoolContract: PopLocker | Staking,
      isPopLocker: boolean,
    ): Promise<TransactionResponse | null> => {
      console.log(stakingPoolContract.address, isPopLocker);
      if (!stakingPoolContract || !account || !chainId) {
        return null;
      }
      return stakingPoolContract
        .connect(library.getSigner())
        .getReward(isPopLocker ? account : null);
    },
    [library, account, chainId],
  );
}
