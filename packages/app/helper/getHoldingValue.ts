import { BigNumber, constants } from "ethers/lib/ethers";

export default function getHoldingValue(tokenAmount: BigNumber, tokenPrice: BigNumber): BigNumber {
  tokenAmount = tokenAmount ? tokenAmount : constants.Zero;
  return tokenAmount.eq(constants.Zero) || tokenPrice.eq(constants.Zero)
    ? constants.Zero
    : tokenAmount.mul(tokenPrice).div(constants.WeiPerEther);
}