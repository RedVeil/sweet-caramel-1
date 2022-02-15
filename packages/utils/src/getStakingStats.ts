import { parseEther } from "@ethersproject/units";
import { ChainId } from "@popcorn/app/context/Web3/connectors";
import { ButterDependencyContracts, Contracts } from "@popcorn/app/context/Web3/contracts";
import { PopLocker, Staking } from "@popcorn/hardhat/typechain";
import { BigNumber } from "ethers";
import ButterBatchAdapter from "../../hardhat/lib/adapters/ButterBatchAdapter";
import UniswapPoolAdapter from "../../hardhat/lib/adapters/UniswapPoolAdapter";
import { ERC20, ERC20__factory } from "../../hardhat/typechain";
import { formatAndRoundBigNumber } from ".";
import { Address } from "./types";

export interface StakingPoolInfo {
  stakingContractAddress: string;
  stakedTokenAddress: string;
  stakedTokenName?: string;
  apy: string;
  totalStake: BigNumber;
  tokenEmission: BigNumber;
  earned?: BigNumber;
}

async function getLpTokenApy(
  contracts: Contracts,
  chainId: number,
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
): Promise<string> {
  if (chainId === ChainId.Ethereum) {
    const [usdcAmount, popAmount] = await contracts.popUsdcLp.getUnderlyingBalances();
    return await getPool2Apy(usdcAmount, popAmount, tokenPerWeek, totalStaked, contracts);
  } else {
    let usdcAmount = await contracts.usdc.balanceOf(contracts.popUsdcLp.address);
    const popAmount = await contracts.pop.balanceOf(contracts.popUsdcLp.address);
    if (usdcAmount.eq(BigNumber.from("0")) || popAmount.eq(BigNumber.from("0"))) {
      return "∞";
    }
    return await getPool2Apy(usdcAmount, popAmount, tokenPerWeek, totalStaked, contracts);
  }
}

export async function calculateApy(
  stakedTokenAddress: Address,
  contracts: Contracts,
  chaindId: number,
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  butterDependencyContracts?: ButterDependencyContracts,
): Promise<string> {
  //Prevents `div by 0` errors
  if (!totalStaked || totalStaked.eq(BigNumber.from("0"))) {
    return "∞";
  }
  if (stakedTokenAddress.toLowerCase() === contracts.pop.address.toLowerCase()) {
    return await getPopApy(tokenPerWeek, totalStaked);
  }
  if (stakedTokenAddress.toLowerCase() === contracts.popUsdcLp.address.toLowerCase()) {
    return await getLpTokenApy(contracts, chaindId, tokenPerWeek, totalStaked);
  }
  if (butterDependencyContracts && stakedTokenAddress.toLowerCase() === contracts.butter.address.toLowerCase()) {
    return await getButterApy(tokenPerWeek, totalStaked, contracts, butterDependencyContracts);
  }
  return "0";
}

async function getPopApy(tokenPerWeek: BigNumber, totalStaked: BigNumber): Promise<string> {
  const tokenPerWeekPerShare = tokenPerWeek.mul(parseEther("1")).div(totalStaked);
  const apy = tokenPerWeekPerShare.mul(52);
  return formatAndRoundBigNumber(apy.mul(100), 3);
}

async function getPool2Apy(
  usdcAmount: BigNumber,
  popAmount: BigNumber,
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  contracts: any,
): Promise<string> {
  usdcAmount = usdcAmount.mul(BigNumber.from(1e12));
  const totalSupply = await contracts.popUsdcLp.totalSupply();

  const popPrice = usdcAmount.mul(parseEther("1")).div(popAmount);
  const totalUnderlyingValue = usdcAmount.add(popAmount.mul(popPrice).div(parseEther("1")));
  const gUniPrice = totalUnderlyingValue.mul(parseEther("1")).div(totalSupply);
  const stakeValue = totalStaked.mul(gUniPrice).div(parseEther("1"));

  const weeklyRewardsValue = tokenPerWeek.mul(popPrice).div(parseEther("1"));

  const weeklyRewardsPerDollarStaked = weeklyRewardsValue.mul(parseEther("1")).div(stakeValue);

  const apy = weeklyRewardsPerDollarStaked.mul(52);
  return formatAndRoundBigNumber(apy.mul(100), 3);
}

async function getButterApy(
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  contracts: Contracts,
  butterDependencyContracts: ButterDependencyContracts,
): Promise<string> {
  const uniAdapter = new UniswapPoolAdapter(contracts.popUsdcUniV3Pool);
  const butterPrice = await ButterBatchAdapter.getButterValue(
    butterDependencyContracts.setBasicIssuanceModule,
    {
      [butterDependencyContracts.yMim.address.toLowerCase()]: {
        metaPool: butterDependencyContracts.crvMimMetapool,
        yPool: butterDependencyContracts.yMim,
      },
      [butterDependencyContracts.yFrax.address.toLowerCase()]: {
        metaPool: butterDependencyContracts.crvFraxMetapool,
        yPool: butterDependencyContracts.yFrax,
      },
    },
    contracts.butter?.address,
  );
  const popPrice = await uniAdapter.getTokenPrice();
  const stakeValue = totalStaked.mul(butterPrice).div(parseEther("1"));

  const weeklyRewardsValue = tokenPerWeek.mul(popPrice).div(parseEther("1"));

  const weeklyRewardsPerDollarStaked = weeklyRewardsValue.mul(parseEther("1")).div(stakeValue);

  const apy = weeklyRewardsPerDollarStaked.mul(52);
  return formatAndRoundBigNumber(apy.mul(100), 3);
}

export async function getSingleStakingPoolInfo(
  stakingContract: Staking | PopLocker,
  contracts: Contracts,
  chainId: number,
  library: any,
  stakedTokenAddress?: Address,
  stakedTokenName?: string,
  butterDependencyContracts?: ButterDependencyContracts,
): Promise<StakingPoolInfo> {
  const tokenPerWeek =
    stakedTokenName === "Popcorn"
      ? await (stakingContract as PopLocker).getRewardForDuration(stakedTokenAddress)
      : await (stakingContract as Staking)?.getRewardForDuration({
          gasLimit: "2000000",
        });
  const totalStaked =
    stakedTokenName === "Popcorn"
      ? await (stakingContract as PopLocker)?.lockedSupply()
      : await (stakingContract as Staking)?.totalSupply({
          gasLimit: "2000000",
        });
  if (!stakedTokenAddress) {
    stakedTokenAddress = await (stakingContract as Staking)?.stakingToken({
      gasLimit: 2000000,
    });
  }
  if (!stakedTokenName) {
    stakedTokenName = await getStakedTokenName(stakedTokenAddress, library);
  }
  return {
    stakingContractAddress: stakingContract?.address,
    stakedTokenAddress: stakedTokenAddress,
    stakedTokenName: stakedTokenName,
    apy: await calculateApy(
      stakedTokenAddress,
      contracts,
      chainId,
      tokenPerWeek,
      totalStaked,
      butterDependencyContracts,
    ),
    totalStake: totalStaked,
    tokenEmission: tokenPerWeek?.div(7) || BigNumber.from(0),
  };
}

export async function getStakedTokenName(stakedTokenAddress: Address, library: any): Promise<string> {
  try {
    if (stakedTokenAddress && stakedTokenAddress.length > 1) {
      const contract: ERC20 = await ERC20__factory.connect(stakedTokenAddress, library);
      const result = contract ? await contract.name() : "";
      return result;
    }
  } catch (ex) {
    console.log(ex);
  }
}

export async function getStakingPoolsInfo(
  contracts: Contracts,
  chainId: number,
  library: any,
  butterDependencyContracts?: ButterDependencyContracts,
): Promise<StakingPoolInfo[]> {
  let stakingPools: StakingPoolInfo[] = [];
  const stakingContracts = contracts ? [contracts.popStaking, ...contracts.staking] : [];
  if (contracts && stakingContracts && stakingContracts.length > 0) {
    for (let i = 0; i < stakingContracts.length; i++) {
      const stakingContract = stakingContracts[i];

      stakingPools[i] = await getSingleStakingPoolInfo(
        stakingContract,
        contracts,
        chainId,
        library,
        stakingContract.address.toLowerCase() === contracts.popStaking?.address.toLowerCase()
          ? contracts.pop.address
          : undefined,
        stakingContract.address === contracts.popStaking?.address ? "Popcorn" : undefined,
        butterDependencyContracts,
      );
    }
    return stakingPools;
  }
  return stakingPools;
}

export async function getEarned(
  staking: Staking | PopLocker,
  account: string,
  isPopLocker: boolean,
): Promise<BigNumber> {
  if (isPopLocker) {
    const rewardRes = await (staking as PopLocker)?.claimableRewards(account);
    if (rewardRes === undefined || rewardRes?.length === 0) {
      return BigNumber.from("0");
    }
    return rewardRes[0].amount;
  }
  return await (staking as Staking)?.earned(account);
}
