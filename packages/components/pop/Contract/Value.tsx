import { BigNumber, constants } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { formatAndRoundBigNumber } from "packages/utils";

interface Props {
  price?: BigNumber;
  balance?: BigNumber;
  decimals?: number;
}
export const Value = ({ price, balance, decimals }: Props) => {
  const value =
    (balance &&
      price &&
      balance
        .mul(price)
        .mul(parseUnits("1", decimals == 6 ? 12 : 0))
        .div(parseUnits("1", 18))) ||
    constants.Zero;

  return <>{(!!price && !!balance && "$" + formatAndRoundBigNumber(value, 18)) || ""}</>;
};
