import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { useMemo } from "react";
import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { Pop, BigNumberWithFormatted } from "../../types";

/**
 * useBalanceValue hook is used to calculate the value of an account balance of a given token
 * @returns value of balance in USD terms based on token price
 */
interface UseBalanceValueProps {
  price?: BigNumber;
  balance?: BigNumber;
  decimals?: number;
}
export const useBalanceValue: Pop.Hook<BigNumberWithFormatted, UseBalanceValueProps> = ({
  price,
  balance,
  enabled,
  account,
  address,
  chainId,
  decimals = 18,
}): Pop.HookResult<BigNumberWithFormatted> => {
  return useMemo(() => {
    const empty = {
      data: { value: undefined, formatted: undefined },
      status: "idle",
    } as Pop.HookResult<BigNumberWithFormatted>;
    if (typeof enabled === "boolean" && !enabled) return empty;
    if (price && balance) {
      const value = balance
        .mul(price)
        .mul(parseUnits("1", decimals == 6 ? 12 : 0))
        .div(parseUnits("1", 18));
      return {
        data: { value, formatted: value && formatAndRoundBigNumber(value, 18) },
        status: "success",
      };
    }
    return empty;
  }, [balance, price, account, address, chainId]);
};
