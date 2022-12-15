import { BigNumber, constants } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { Pop } from "../types";
import { withLoading } from "../utils";

interface Props {
  price?: BigNumber;
  balance?: BigNumber;
  decimals?: number;
}
const eth_call =
  (Component: Pop.FC<any>) =>
  ({
    price,
    balance,
    decimals,
    status,
    callback,
  }: Props & { status?: "idle" | "error" | "success" | "loading" } & { callback?: (value?: BigNumber) => void }) => {
    const value =
      (balance &&
        price &&
        balance
          .mul(price)
          .mul(parseUnits("1", decimals == 6 ? 12 : 0))
          .div(parseUnits("1", 18))) ||
      constants.Zero;
    if (status === "success" && callback && value) {
      callback(value);
    }
    return <Component {...{ price, balance, decimals, value, status }} />;
  };

export const Value = eth_call(withLoading(({ value }) => <>{"$" + formatAndRoundBigNumber(value, 18)}</>));
