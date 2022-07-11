import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { BigNumber, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";

export const formatStakedAmount = (value: BigNumber): string => {
  if (BigNumber.isBigNumber(value)) {
    if (value.eq(constants.Zero)) {
      return "0";
    }
    if (value.gte(parseEther("1"))) {
      return formatAndRoundBigNumber(value, 2);
    }
    return `${formatAndRoundBigNumber(value, 5)}...`;
  }
  return `Invalid val: ${value}`;
};

// dev - tokenPrice and tokens should both have a consistent decimal points. That is 18.
export const formatStakedTVL = (tokens: BigNumber, tokenPrice: BigNumber): string => {
  const tvl = tokens.mul(tokenPrice).div(constants.WeiPerEther);
  return "$" + formatAndRoundBigNumber(tvl, 0);
};
