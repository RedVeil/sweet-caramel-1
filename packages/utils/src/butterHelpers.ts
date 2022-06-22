import { BigNumber, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { AccountBatch, HotSwapParameter } from "./types";

export const isButterSupportedOnCurrentNetwork = (chainId: number) => {
  const butterSupportedChains = [1, 31337, 1337];
  return butterSupportedChains.includes(chainId);
};

export function prepareHotSwap(batches: AccountBatch[], depositAmount: BigNumber): HotSwapParameter {
  let cumulatedBatchAmounts = constants.Zero;
  const batchIds: string[] = [];
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
  slippage: number,
  virtualPrice: BigNumber,
  inputDecimals = 18,
  outputDecimals = 18,
): BigNumber => {
  let depositAmountInOutputDecimals: BigNumber;
  // Raise or lower the mintAmount based on the difference in decimals between inputToken/outputToken
  const difDecimals = inputDecimals - outputDecimals;

  if (difDecimals === 0) {
    depositAmountInOutputDecimals = depositAmount;
  } else if (difDecimals > 0) {
    depositAmountInOutputDecimals = depositAmount.div(BigNumber.from(10).pow(difDecimals));
  } else {
    depositAmountInOutputDecimals = depositAmount.mul(BigNumber.from(10).pow(Math.abs(difDecimals)));
  }

  const outputAmount = depositAmountInOutputDecimals.mul(parseEther("1")).div(virtualPrice);
  const delta = outputAmount.mul(percentageToBps(slippage)).div(10000);
  return outputAmount.sub(delta);
};

export const percentageToBps = (input: number): number => input * 100;
