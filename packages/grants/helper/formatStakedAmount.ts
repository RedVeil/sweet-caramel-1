import { BigNumber, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { formatAndRoundBigNumber } from "../../utils/src/formatBigNumber";

export const formatStakedAmount = (num: BigNumber): string => {
  if (num.lte(parseEther("1")) && num.gt(constants.Zero)) {
    return formatAndRoundBigNumber(num, 6);
  } else {
    return formatAndRoundBigNumber(num, 3);
  }
};
