import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { BigNumber, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";

export const formatStakedAmount = (num: BigNumber): string => {
  if (num.lte(parseEther("1")) && num.gt(constants.Zero)) {
    return formatAndRoundBigNumber(num, 6);
  } else {
    return formatAndRoundBigNumber(num, 3);
  }
};

// dev - tokenPrice and tokens should both have a consistent decimal points. That is 18.
export const formatStakedTVL = (tokens: BigNumber, tokenPrice: BigNumber): string => {
  const tvl = tokens.mul(tokenPrice).div(constants.WeiPerEther);
  return "$" + formatAndRoundBigNumber(tvl, 0);
};
