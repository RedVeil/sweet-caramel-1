import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";

export const formatStakedAmount = (num: BigNumber): string => {
  if (num.lte(parseEther("1")) && num.gt(BigNumber.from("0"))) {
    return formatAndRoundBigNumber(num, 6);
  } else {
    return formatAndRoundBigNumber(num, 3);
  }
};
