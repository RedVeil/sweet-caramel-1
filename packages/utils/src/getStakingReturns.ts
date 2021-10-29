import { parseEther } from '@ethersproject/units';
import { StakingRewards } from '../../hardhat/typechain';
import { bigNumberToNumber } from './formatBigNumber';

async function calculateAPY(stakingContract: StakingRewards): Promise<number> {
  const tokenPerWeek = await stakingContract.getRewardForDuration();
  const totalStaked = await stakingContract.totalSupply();
  const tokenPerWeekPerShare = tokenPerWeek
    .mul(parseEther('1'))
    .div(totalStaked);
  const apy = tokenPerWeekPerShare.mul(52);
  return bigNumberToNumber(apy.mul(100));
}
export default calculateAPY;
