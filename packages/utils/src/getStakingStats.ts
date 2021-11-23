import { parseEther } from '@ethersproject/units';
import { Contracts } from '@popcorn/app/context/Web3/contracts';
import { BigNumber } from 'ethers';
import { ERC20, ERC20__factory, StakingRewards } from '../../hardhat/typechain';
import { bigNumberToNumber } from './formatBigNumber';
import { Address } from './types';

export interface StakingPoolInfo {
  stakedTokenAddress: string;
  stakedTokenName?: string;
  apy: number;
  totalStake: number;
  tokenEmission: number;
}
// export interface StakingStats {
//   stats: Array<StakingPoolInfo>
// }

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

export async function getSingleStakingPoolInfo(
  stakingContract: StakingRewards,
  stakedTokenAddress: Address,
  stakedTokenName?: string,
): Promise<StakingPoolInfo> {
  const tokenPerWeek = await stakingContract.getRewardForDuration({
    gasLimit: '2000000',
  });
  const totalStaked = await stakingContract.totalSupply({
    gasLimit: '2000000',
  });
  return {
    stakedTokenAddress,
    stakedTokenName: stakedTokenName ? stakedTokenName : 'NA',
    apy: await calculateAPY(tokenPerWeek, totalStaked),
    totalStake: bigNumberToNumber(totalStaked),
    tokenEmission: bigNumberToNumber(tokenPerWeek),
  };
}

export async function getStakedTokenName(
  stakingContractAddress: Address,
  library: any,
): Promise<string> {
  let result: string = '';
  const contract: ERC20 = await ERC20__factory.connect(
    stakingContractAddress,
    library,
  );
  result = await contract.name();
  return result;
}

export async function getStakingPoolsInfo(
  contracts: Contracts,
  library: any,
): Promise<StakingPoolInfo[]> {
  let stakingPools: StakingPoolInfo[] = [];
  const stakingContracts = contracts ? contracts.staking : [];
  if (contracts && stakingContracts && stakingContracts.length > 0) {
    for (let i = 0; i < stakingContracts.length; i++) {
      const stakingContract = stakingContracts[i];
      const tokenPerWeek = await stakingContract.getRewardForDuration({
        gasLimit: 2000000,
      });
      const totalStaked = await stakingContract.totalSupply({
        gasLimit: 2000000,
      });
      const stakedTokenAddress: string = await stakingContract.stakingToken({
        gasLimit: 2000000,
      });
      const apy = await calculateAPY(tokenPerWeek, totalStaked);
      const totalStake = await bigNumberToNumber(totalStaked);
      const tokenEmission = await bigNumberToNumber(tokenPerWeek);
      const stakedTokenName = await getStakedTokenName(
        stakedTokenAddress,
        library,
      );
      const stakingInfo = {
        stakedTokenAddress: stakedTokenAddress,
        stakedTokenName: stakedTokenName,
        apy,
        totalStake,
        tokenEmission,
      };
      stakingPools.push(stakingInfo);
    }
    return stakingPools;
  }
  return stakingPools;
}
