import { parseEther } from '@ethersproject/units';
import { Contracts } from '../../app/context/Web3/contracts';
import { StakingRewards } from '../../hardhat/typechain';
import { bigNumberToNumber } from './formatBigNumber';
import { TokenBalances } from './getBalances';

export async function getEarned(
  account: string,
  contracts: Contracts,
): Promise<TokenBalances> {
  return {
    pop: bigNumberToNumber(await contracts.staking.pop.earned(account)),
    popEthLp: bigNumberToNumber(
      await contracts.staking.popEthLp.earned(account),
    ),
    butter: bigNumberToNumber(await contracts.staking.butter.earned(account)),
  };
}

export async function getStakingReturns(
  contracts: Contracts,
): Promise<TokenBalances> {
  return {
    pop: await calculateAPY(contracts.staking.pop),
    popEthLp: await calculateAPY(contracts.staking.popEthLp),
    butter: await calculateAPY(contracts.staking.butter),
  };
}

export async function calculateAPY(
  stakingContract: StakingRewards,
): Promise<number> {
  const tokenPerWeek = await stakingContract.getRewardForDuration();
  const totalStaked = await stakingContract.totalSupply();
  const tokenPerWeekPerShare = tokenPerWeek
    .mul(parseEther('1'))
    .div(totalStaked);
  const apy = tokenPerWeekPerShare.mul(52);
  return bigNumberToNumber(apy.mul(100));
}
