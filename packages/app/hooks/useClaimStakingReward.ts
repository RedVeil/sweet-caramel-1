import type { TransactionResponse } from "@ethersproject/providers";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { PopLocker, Staking } from "@popcorn/hardhat/typechain";
import { useCallback } from "react";

export type StakingPool = {
  address: string;
  pool: Staking;
};

export default function useClaimStakingReward() {
  const { signer, account } = useWeb3();
  return useCallback(
    async (stakingPoolContract: PopLocker | Staking, isPopLocker: boolean): Promise<TransactionResponse | null> => {
      if (!stakingPoolContract || !signer || !account) {
        return null;
      }
      return stakingPoolContract.connect(signer).getReward(isPopLocker ? account : null);
    },
    [signer, account],
  );
}
