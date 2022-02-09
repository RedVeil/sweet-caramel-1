import { BigNumber, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";

export function formatAndRoundBigNumber(value: BigNumber, digits?: number, decimals?: number): string {
  if (BigNumber.isBigNumber(value)) {
    return Number(utils.formatEther(value)).toLocaleString(undefined, {
      maximumFractionDigits: digits ? digits : 0,
    });
  }
  return `Invalid val: ${value}`;
}

export function formatBigNumber(value: BigNumber, decimals: number = 18): string {
  if (BigNumber.isBigNumber(value)) {
    return utils.formatUnits(value, decimals);
  }
  return "0";
}

export function bigNumberToNumber(value: BigNumber): number {
  if (BigNumber.isBigNumber(value)) {
    return Number(utils.formatEther(value));
  }
  return 0;
}

export function numberToBigNumber(value: number | string, decimals: number = 18): BigNumber {
  if (typeof value === "number") {
    return BigNumber.from(parseEther(String(value)));
  } else if (typeof value === "string") {
    return BigNumber.from(parseEther(value));
  }
  return BigNumber.from("0");
}

export function scaleNumberToBigNumber(value: number): BigNumber {
  if (typeof value === "number") {
    return utils.parseEther(String(value));
  }
  return utils.parseEther("0");
}
