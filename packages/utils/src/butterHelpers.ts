import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { AccountBatch, HotSwapParameter } from "./types";

export const isButterSupportedOnCurrentNetwork = (chainId: number) => {
  const butterSupportedChains = [1, 31337, 1337];
  return butterSupportedChains.includes(chainId);
};

export function prepareHotSwap(batches: AccountBatch[], depositAmount: BigNumber): HotSwapParameter {
  let cumulatedBatchAmounts = BigNumber.from("0");
  const batchIds: String[] = [];
  const amounts: BigNumber[] = [];
  batches.forEach((batch) => {
    if (cumulatedBatchAmounts < depositAmount) {
      const missingAmount = depositAmount.sub(cumulatedBatchAmounts);
      const amountOfBatch = batch.accountClaimableTokenBalance.gt(missingAmount)
        ? missingAmount
        : batch.accountClaimableTokenBalance;
      cumulatedBatchAmounts = cumulatedBatchAmounts.add(amountOfBatch);
      const shareValue = batch.accountClaimableTokenBalance.mul(parseEther("1")).div(batch.accountSuppliedTokenBalance);

      batchIds.push(batch.batchId);
      amounts.push(
        amountOfBatch.eq(batch.accountClaimableTokenBalance)
          ? batch.accountSuppliedTokenBalance
          : amountOfBatch.mul(parseEther("1")).div(shareValue),
      );
    }
  });
  return { batchIds: batchIds, amounts: amounts };
}

export function adjustDepositDecimals(depositAmount: BigNumber, tokenKey: string): BigNumber {
  if (tokenKey === "usdc" || tokenKey === "usdt") {
    return depositAmount.div(BigNumber.from(1e12));
  } else {
    return depositAmount;
  }
}

export const getMinMintAmount = (
  depositAmount: BigNumber,
  tokenKey: string,
  slippage: number,
  virtualPrice: BigNumber,
): BigNumber => {
  slippage = slippage * 100;
  const denominator = 10000;
  depositAmount = adjustDepositDecimals(depositAmount, tokenKey);
  const lpTokenAmount = depositAmount.mul(parseEther("1")).div(virtualPrice);
  const delta = lpTokenAmount.mul(slippage).div(denominator);
  return lpTokenAmount.sub(delta);
};
