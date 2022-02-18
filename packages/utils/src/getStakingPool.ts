import { BigNumber, constants } from "ethers";
import { getPopApy } from ".";
import { PopLocker, Staking } from "../../hardhat/typechain";
import { calculateApy } from "./calculateAPY";
import { Address, ContractAddresses, StakingPool } from "./types";
import { getTokenFromAddress } from "./getToken";

export interface PopLockerMetadata extends StakingPool {
  contract: PopLocker;
}

export interface StakingPoolMetadata extends StakingPool {
  contract: Staking;
}

export async function getStakingPool(
  key: string,
  account: Address,
  staking: Staking,
  contractAddresses: ContractAddresses,
  chainId: number,
  library,
): Promise<StakingPoolMetadata> {
  const tokenAddress = await staking.stakingToken();
  const totalStake = await staking.totalSupply();
  const tokenPerWeek = await staking.getRewardForDuration();
  const apy = await calculateApy(tokenAddress, tokenPerWeek, totalStake, contractAddresses, chainId, library);
  const earned = account ? await staking.earned(account) : constants.Zero;
  const userStake = account ? await staking.balanceOf(account) : constants.Zero;
  const stakingToken = await getTokenFromAddress(tokenAddress, library);

  return {
    contract: staking,
    address: staking.address,
    tokenAddress,
    apy,
    userStake,
    totalStake,
    tokenEmission: tokenPerWeek?.div(7) || constants.Zero,
    earned,
    stakingToken,
  };
}

export async function getPopLocker(key: string, popLocker: PopLocker, account?: Address): Promise<PopLockerMetadata> {
  const tokenAddress = await popLocker.stakingToken();
  const totalStake = await popLocker.lockedSupply();
  const tokenPerWeek = await popLocker.getRewardForDuration(tokenAddress);
  const apy = await getPopApy(tokenPerWeek, totalStake);
  const userRewards = account ? await popLocker.claimableRewards(account) : [{ amount: constants.Zero }];
  const earned = userRewards && userRewards.length > 0 ? userRewards[0].amount : constants.Zero;
  const userStake = account ? await popLocker.lockedBalanceOf(account) : constants.Zero;
  const withdrawable = account ? (await popLocker.lockedBalances(account)).unlockable : constants.Zero;
  const stakingToken = await getTokenFromAddress(tokenAddress, popLocker.provider);

  return {
    contract: popLocker,
    address: popLocker.address,
    tokenAddress,
    apy,
    userStake,
    totalStake,
    tokenEmission: tokenPerWeek?.div(7) || BigNumber.from(0),
    earned,
    withdrawable,
    stakingToken,
  };
}