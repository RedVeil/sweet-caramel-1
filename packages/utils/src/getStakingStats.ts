import { parseEther } from '@ethersproject/units';
import { Contracts } from '@popcorn/app/context/Web3/contracts';
import { StakingRewards } from '@popcorn/hardhat/typechain/StakingRewards';
import { BigNumber } from 'ethers';
import { bigNumberToNumber } from './formatBigNumber';

export interface SingleStakingStats {
  apy: number;
  totalStake: number;
  tokenEmission: number;
}
export interface StakingStats {
  pop: SingleStakingStats;
  popEthLp: SingleStakingStats;
  butter: SingleStakingStats;
}

export async function calculateAPY(
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
): Promise<number> {
  //Prevents `div by 0` errors
  if (totalStaked.eq(BigNumber.from('0'))) {
    return Infinity;
  }

  const tokenPerWeekPerShare = tokenPerWeek
    .mul(parseEther('1'))
    .div(totalStaked);
  const apy = tokenPerWeekPerShare.mul(52);
  return bigNumberToNumber(apy.mul(100));
}

export async function getSingleStakingStats(
  stakingContract: StakingRewards,
): Promise<SingleStakingStats> {
  const tokenPerWeek = await stakingContract.getRewardForDuration();
  const totalStaked = await stakingContract.totalSupply();
  return {
    apy: await calculateAPY(tokenPerWeek, totalStaked),
    totalStake: bigNumberToNumber(totalStaked),
    tokenEmission: bigNumberToNumber(tokenPerWeek),
  };
}

export async function getStakingStats(
  contracts: Contracts,
): Promise<StakingStats> {
  return {
    pop: await getSingleStakingStats(contracts.staking.pop),
    popEthLp: await getSingleStakingStats(contracts.staking.popEthLp),
    butter: await getSingleStakingStats(contracts.staking.butter),
  };
}
