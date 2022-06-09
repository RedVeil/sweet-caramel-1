import { BigNumber } from "@ethersproject/bignumber";
import { formatAndRoundBigNumber } from "@popcorn/utils";

export function formatBatchInputToken(tokenAmount: BigNumber, isMint: boolean, isFourX: boolean) {
  if (isFourX) {
    return isMint
      ? `${formatAndRoundBigNumber(tokenAmount, 2, 6)} ${"USDC"}`
      : `${formatAndRoundBigNumber(tokenAmount, 6)} ${"4X"}`;
  } else {
    return isMint
      ? `${formatAndRoundBigNumber(tokenAmount, 2)} ${"3CRV"}`
      : `${formatAndRoundBigNumber(tokenAmount, 6)} ${"BTR"}`;
  }
}

export function formatBatchOutputToken(tokenAmount: BigNumber, isMint: boolean, isFourX: boolean) {
  if (isFourX) {
    return isMint
      ? `${formatAndRoundBigNumber(tokenAmount, 6)} ${"4X"}`
      : `${formatAndRoundBigNumber(tokenAmount, 2, 6)} ${"USDC"}`;
  } else {
    return isMint
      ? `${formatAndRoundBigNumber(tokenAmount, 6)} ${"BTR"}`
      : `${formatAndRoundBigNumber(tokenAmount, 2)} ${"3CRV"}`;
  }
}
