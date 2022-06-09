import { BigNumber } from "@ethersproject/bignumber";
import { formatAndRoundBigNumber } from "@popcorn/utils";

export function formatBatchInputToken(tokenAmount: BigNumber, isMint: boolean, isThreeX: boolean) {
  if (isThreeX) {
    return isMint
      ? `${formatAndRoundBigNumber(tokenAmount, 2, 6)} ${"USDC"}`
      : `${formatAndRoundBigNumber(tokenAmount, 6)} ${"3X"}`;
  } else {
    return isMint
      ? `${formatAndRoundBigNumber(tokenAmount, 2)} ${"3CRV"}`
      : `${formatAndRoundBigNumber(tokenAmount, 6)} ${"BTR"}`;
  }
}

export function formatBatchOutputToken(tokenAmount: BigNumber, isMint: boolean, isThreeX: boolean) {
  if (isThreeX) {
    return isMint
      ? `${formatAndRoundBigNumber(tokenAmount, 6)} ${"3X"}`
      : `${formatAndRoundBigNumber(tokenAmount, 2, 6)} ${"USDC"}`;
  } else {
    return isMint
      ? `${formatAndRoundBigNumber(tokenAmount, 6)} ${"BTR"}`
      : `${formatAndRoundBigNumber(tokenAmount, 2)} ${"3CRV"}`;
  }
}
