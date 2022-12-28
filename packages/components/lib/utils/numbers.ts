import { BigNumber, constants } from "ethers";

const ZERO = constants.Zero.toString();
export const getPercentage = (total: BigNumber | undefined, partial: BigNumber | undefined) => {
  return total?.gt(0) && partial?.gt(0)
    ? parseFloat((100 * ((partial._hex as any) / (total._hex as any))) as any).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })
    : ZERO;
};
