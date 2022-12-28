import { BigNumber, constants } from "ethers";

const ZERO = constants.Zero.toString();
const HUNDRED = constants.Zero.add(100);

export const getPercentage = (total: BigNumber | undefined, partial: BigNumber | undefined) => {
  return total?.gt(0) && partial?.gt(0) ? HUNDRED.mul(partial).div(total).toString() : ZERO;
};
