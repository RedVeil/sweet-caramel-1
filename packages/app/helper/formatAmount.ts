import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { BigNumber, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";

export const formatStakedAmount = (num: BigNumber): string => {
  if (num.lte(parseEther("1")) && num.gt(BigNumber.from("0"))) {
    return formatAndRoundBigNumber(num, 6);
  } else {
    return formatAndRoundBigNumber(num, 3);
  }
};

// dev - tokenPrice and tokens should both have a consistent decimal points. That is 18.
export const formatStakedTVL = (tokens: BigNumber, tokenPrice: BigNumber): string => {
  const tvl = tokens.mul(tokenPrice).div(constants.WeiPerEther);
  if (tvl.lte(parseEther("1")) && tvl.gt(BigNumber.from("0"))) {
    return formatAndRoundBigNumber(tvl, 0) + "$";
  } else {
    return formatAndRoundBigNumber(tvl, 0) + "$";
  }
};
