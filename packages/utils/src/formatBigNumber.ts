import { BigNumber, constants, utils } from "ethers";
import { parseUnits } from "ethers/lib/utils";

const MILLION = 1e6;
const THOUSAND = 1e3;

export function formatAndRoundBigNumber(value: BigNumber, decimals: number): string {
  if (BigNumber.isBigNumber(value)) {
    const formatedValue = Number(utils.formatUnits(value, decimals));
    if (formatedValue > MILLION) {
      return `${(formatedValue / MILLION).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}M`;
    } else if (formatedValue > THOUSAND) {
      return `${(formatedValue / THOUSAND).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}k`;
    } else if (formatedValue >= 1) {
      return formatedValue.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
    } else if (formatedValue >= 1 / 1e6) {
      return formatedValue.toLocaleString(undefined, {
        maximumFractionDigits: 6,
      });
    } else if (formatedValue < 1) {
      return formatedValue.toLocaleString(undefined, {
        maximumFractionDigits: 12,
      });
    }
  }
  return `Invalid val: ${value}`;
}

export function numberToBigNumber(value: number | string, decimals: number): BigNumber {
  if (typeof value === "number") {
    return BigNumber.from(parseUnits(String(value), decimals));
  } else if (typeof value === "string") {
    if (value == "" || value == ".") value = "0";
    return BigNumber.from(parseUnits(value, decimals));
  }
  return constants.Zero;
}
