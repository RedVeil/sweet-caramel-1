import { parseEther } from "@ethersproject/units";
import {
  IBasicIssuanceModule__factory,
  ButterBatchProcessing__factory,
  ERC20,
  ERC20__factory,
  IGUni,
  IGUni__factory,
} from "@popcorn/hardhat/typechain";
import { BigNumber, constants } from "ethers";
import { ChainId } from "./connectors";
import { Address, ContractAddresses } from "./types";

export async function calculateApy(
  stakedTokenAddress: Address,
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  contractAddresses: ContractAddresses,
  chaindId: number,
  library,
): Promise<BigNumber> {
  //Prevents `div by 0` errors
  if (!totalStaked || totalStaked.eq(constants.Zero)) {
    return BigNumber.from("-1");
  }
  switch (stakedTokenAddress.toLocaleLowerCase()) {
    case contractAddresses.popUsdcArrakisVault?.toLocaleLowerCase():
    case contractAddresses.popUsdcLp?.toLocaleLowerCase():
      return getLpTokenApy(tokenPerWeek, totalStaked, contractAddresses, chaindId, library, stakedTokenAddress);
    case contractAddresses.butter?.toLocaleLowerCase():
    case contractAddresses.threeX?.toLocaleLowerCase():
      return getButterApy(tokenPerWeek, totalStaked, contractAddresses, chaindId, library);
    default:
      return constants.Zero;
  }
}

export async function getLpTokenApy(
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  contractAddresses: ContractAddresses,
  chainId: number,
  library,
  stakedTokenAddress,
): Promise<BigNumber> {
  if (contractAddresses.popUsdcArrakisVault === stakedTokenAddress) {
    const popUsdcLp = IGUni__factory.connect(contractAddresses.popUsdcArrakisVault, library);
    const [usdcAmount, popAmount] = await popUsdcLp.getUnderlyingBalances();
    return getPool2Apy(usdcAmount, popAmount, tokenPerWeek, totalStaked, popUsdcLp);
  } else if (chainId === ChainId.Ethereum) {
    const popUsdcLp = IGUni__factory.connect(contractAddresses.popUsdcLp, library);
    const [usdcAmount, popAmount] = await popUsdcLp.getUnderlyingBalances();
    return getPool2Apy(usdcAmount, popAmount, tokenPerWeek, totalStaked, popUsdcLp);
  } else {
    const popUsdcLp = ERC20__factory.connect(contractAddresses.popUsdcLp, library);
    let usdcAmount = await ERC20__factory.connect(contractAddresses.usdc, library).balanceOf(
      contractAddresses.popUsdcLp,
    );
    const popAmount = await ERC20__factory.connect(contractAddresses.pop, library).balanceOf(
      contractAddresses.popUsdcLp,
    );
    if (usdcAmount.eq(constants.Zero) || popAmount.eq(constants.Zero)) {
      return BigNumber.from("-1");
    }
    return getPool2Apy(usdcAmount, popAmount, tokenPerWeek, totalStaked, popUsdcLp);
  }
}

export async function getPopApy(tokenPerWeek: BigNumber, totalStaked: BigNumber): Promise<BigNumber> {
  const tokenPerWeekPerShare = tokenPerWeek.mul(parseEther("1")).div(totalStaked);
  const apy = tokenPerWeekPerShare.mul(52);
  return apy.mul(100);
}

async function getPool2Apy(
  usdcAmount: BigNumber,
  popAmount: BigNumber,
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  popUsdcLp: ERC20 | IGUni,
): Promise<BigNumber> {
  usdcAmount = usdcAmount.mul(BigNumber.from(1e12));
  const totalSupply = await popUsdcLp.totalSupply();

  const popPrice = usdcAmount.mul(parseEther("1")).div(popAmount);
  const totalUnderlyingValue = usdcAmount.add(popAmount.mul(popPrice).div(parseEther("1")));
  const gUniPrice = totalUnderlyingValue.mul(parseEther("1")).div(totalSupply);
  const stakeValue = totalStaked.mul(gUniPrice).div(parseEther("1"));

  const weeklyRewardsValue = tokenPerWeek.mul(popPrice).div(parseEther("1"));

  const weeklyRewardsPerDollarStaked = weeklyRewardsValue.mul(parseEther("1")).div(stakeValue);

  const apy = weeklyRewardsPerDollarStaked.mul(52);
  return apy.mul(100);
}

export async function getButterApy(
  tokenPerWeek: BigNumber,
  totalStaked: BigNumber,
  contractAddresses: ContractAddresses,
  chainId: number,
  library,
): Promise<BigNumber> {
  if (![ChainId.Ethereum, ChainId.Localhost, ChainId.Hardhat].includes(chainId)) {
    return constants.Zero;
  }
  let popPrice = parseEther("1");
  if (chainId === ChainId.Ethereum) {
    const popUsdcLp = IGUni__factory.connect(contractAddresses.popUsdcLp, library);
    const [usdcAmount, popAmount] = await popUsdcLp.getUnderlyingBalances();
    popPrice = usdcAmount.mul(parseEther("1")).div(popAmount).mul(BigNumber.from(1e12));
  }

  const butterBatch = ButterBatchProcessing__factory.connect(contractAddresses.butterBatch, library);
  const basicIssuanceModule = IBasicIssuanceModule__factory.connect(
    contractAddresses.butterDependency.setBasicIssuanceModule,
    library,
  );
  const [tokenAddresses, quantities] = await basicIssuanceModule.getRequiredComponentUnitsForIssue(
    contractAddresses.butter,
    parseEther("1"),
  );
  const butterValue = await butterBatch.valueOfComponents(tokenAddresses, quantities);
  const stakeValue = totalStaked.mul(butterValue).div(parseEther("1"));
  const weeklyRewardsValue = tokenPerWeek.mul(popPrice).div(parseEther("1"));

  const weeklyRewardsPerDollarStaked = weeklyRewardsValue.mul(parseEther("1")).div(stakeValue);

  const apy = weeklyRewardsPerDollarStaked.mul(52);
  return apy.mul(100);
}
