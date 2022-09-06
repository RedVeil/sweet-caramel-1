import { parseEther, parseUnits } from "@ethersproject/units";
import { BatchMetadata } from "@popcorn/utils/src/types";
import { BigNumber } from "ethers";
import { ButterPageState } from "../pages/[network]/set/butter";

function isBalanceInsufficient(depositAmount: BigNumber, inputTokenBalance: BigNumber): boolean {
  return depositAmount.gt(inputTokenBalance);
}
export function isDepositDisabled(
  data: BatchMetadata,
  pageState: ButterPageState,
): { disabled: boolean; errorMessage: string } {

  // Check TVL-Limit
  const tvl = data?.totalSupply
    ?.mul(pageState.isThreeX ? data?.tokens?.threeX?.price : data?.tokens?.butter?.price)
    .div(parseEther("1"));
  const tvlLimit = parseEther("1000000"); // 1m
  if (!pageState.redeeming && pageState?.depositAmount.add(tvl).gte(tvlLimit)) {
    return { disabled: true, errorMessage: "*Exceeds TVL-Limit" };
  }

  // Check min-deposit size
  if (
    !pageState.redeeming &&
    !pageState.depositAmount.isZero() &&
    pageState.depositAmount
      .mul(pageState.tokens[pageState.selectedToken.input].price)
      .div(parseUnits("1", 18))
      .lt(parseUnits("99.9", pageState.tokens[pageState.selectedToken.input].decimals)) // Allow for slightly less than 100$ to account for short term oracle inaccuracies and to provide a better UX
  ) {
    return { disabled: true, errorMessage: "*100$ Minimum Deposit required" };
  }

  // Check balance
  if (
    pageState.useUnclaimedDeposits &&
    isBalanceInsufficient(pageState.depositAmount, pageState.tokens[pageState.selectedToken.input].claimableBalance)
  ) {
    return { disabled: true, errorMessage: "*Insufficient balance in unclaimed deposits" };
  }
  if (isBalanceInsufficient(pageState.depositAmount, pageState.tokens[pageState.selectedToken.input].balance)) {
    return { disabled: true, errorMessage: "*Insufficient balance" };
  }
  return { disabled: false, errorMessage: "" };
}
