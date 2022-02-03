import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { formatAndRoundBigNumber } from "../../utils/src/formatBigNumber";

export const formatStakedAmount = (num: BigNumber): string => {
  if (num.lte(parseEther("1")) && num.gt(BigNumber.from("0"))) {
    return formatAndRoundBigNumber(num, 6);
  } else {
    return formatAndRoundBigNumber(num, 3);
  }
};
