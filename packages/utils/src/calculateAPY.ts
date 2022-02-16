import { parseEther } from "@ethersproject/units";
import { ChainId } from "@popcorn/app/context/Web3/connectors";
import { ERC20, ERC20__factory, IGUni, IGUni__factory } from "@popcorn/hardhat/typechain";
import { BigNumber } from "ethers";
import { formatAndRoundBigNumber } from ".";
import { Address, ContractAddresses } from "./types";

export async function calculateApy(
  stakedTokenAddress: Address,
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  contractAddresses: ContractAddresses,
  chaindId: number,
  library,
): Promise<string> {
  //Prevents `div by 0` errors
  if (!totalStaked || totalStaked.eq(BigNumber.from("0"))) {
    return "∞";
  }
  switch (stakedTokenAddress.toLocaleLowerCase()) {
    case contractAddresses.popUsdcLp.toLocaleLowerCase():
      return await getLpTokenApy(tokenPerWeek, totalStaked, contractAddresses, chaindId, library);
  }
  return "0";
}

export async function getLpTokenApy(
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  contractAddresses: ContractAddresses,
  chainId: number,
  library,
): Promise<string> {
  if (chainId === ChainId.Ethereum) {
    const popUsdcLp = IGUni__factory.connect(contractAddresses.popUsdcLp, library);
    const [usdcAmount, popAmount] = await popUsdcLp.getUnderlyingBalances();
    return await getPool2Apy(usdcAmount, popAmount, tokenPerWeek, totalStaked, popUsdcLp);
  } else {
    const popUsdcLp = ERC20__factory.connect(contractAddresses.popUsdcLp, library);
    let usdcAmount = await ERC20__factory.connect(contractAddresses.usdc, library).balanceOf(
      contractAddresses.popUsdcLp,
    );
    const popAmount = await ERC20__factory.connect(contractAddresses.pop, library).balanceOf(
      contractAddresses.popUsdcLp,
    );
    if (usdcAmount.eq(BigNumber.from("0")) || popAmount.eq(BigNumber.from("0"))) {
      return "∞";
    }
    return await getPool2Apy(usdcAmount, popAmount, tokenPerWeek, totalStaked, popUsdcLp);
  }
}

export async function getPopApy(tokenPerWeek: BigNumber, totalStaked: BigNumber): Promise<string> {
  const tokenPerWeekPerShare = tokenPerWeek.mul(parseEther("1")).div(totalStaked);
  const apy = tokenPerWeekPerShare.mul(52);
  return formatAndRoundBigNumber(apy.mul(100), 3);
}

async function getPool2Apy(
  usdcAmount: BigNumber,
  popAmount: BigNumber,
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  popUsdcLp: ERC20 | IGUni,
): Promise<string> {
  usdcAmount = usdcAmount.mul(BigNumber.from(1e12));
  const totalSupply = await popUsdcLp.totalSupply();

  const popPrice = usdcAmount.mul(parseEther("1")).div(popAmount);
  const totalUnderlyingValue = usdcAmount.add(popAmount.mul(popPrice).div(parseEther("1")));
  const gUniPrice = totalUnderlyingValue.mul(parseEther("1")).div(totalSupply);
  const stakeValue = totalStaked.mul(gUniPrice).div(parseEther("1"));

  const weeklyRewardsValue = tokenPerWeek.mul(popPrice).div(parseEther("1"));

  const weeklyRewardsPerDollarStaked = weeklyRewardsValue.mul(parseEther("1")).div(stakeValue);

  const apy = weeklyRewardsPerDollarStaked.mul(52);
  return formatAndRoundBigNumber(apy.mul(100), 3);
}

// export async function getButterApy(
//   tokenPerWeek: BigNumber,
//   totalStaked: BigNumber,
//   contracts: Contracts,
//   butterDependencyContracts: ButterDependencyContracts,
// ): Promise<string> {
//   const uniAdapter = new UniswapPoolAdapter(contracts.popUsdcUniV3Pool);
//   const butterPrice = await ButterBatchAdapter.getButterValue(
//     butterDependencyContracts.setBasicIssuanceModule,
//     {
//       [butterDependencyContracts.yMim.address.toLowerCase()]: {
//         metaPool: butterDependencyContracts.crvMimMetapool,
//         yPool: butterDependencyContracts.yMim,
//       },
//       [butterDependencyContracts.yFrax.address.toLowerCase()]: {
//         metaPool: butterDependencyContracts.crvFraxMetapool,
//         yPool: butterDependencyContracts.yFrax,
//       },
//     },
//     contracts.butter?.address,
//   );
//   const popPrice = await uniAdapter.getTokenPrice();
//   const stakeValue = totalStaked.mul(butterPrice).div(parseEther("1"));

//   const weeklyRewardsValue = tokenPerWeek.mul(popPrice).div(parseEther("1"));

//   const weeklyRewardsPerDollarStaked = weeklyRewardsValue.mul(parseEther("1")).div(stakeValue);

//   const apy = weeklyRewardsPerDollarStaked.mul(52);
//   return formatAndRoundBigNumber(apy.mul(100), 3);
// }
