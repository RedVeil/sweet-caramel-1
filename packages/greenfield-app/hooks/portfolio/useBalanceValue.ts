import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { useMemo } from "react";
import { PortfolioToken } from "../../reducers/portfolio";

/**
 * useBalanceValue hook is used to calculate the value of an account balance of a given token
 * @returns value of balance in USD terms based on token price
 */
interface UseBalanceValueProps {
  token?: PortfolioToken;
  balance?: { value: BigNumber; decimals?: number };
  account?: string;
  enabled?: boolean;
}
export const useBalanceValue = ({ token, balance, account, enabled }: UseBalanceValueProps) => {
  return useMemo(() => {
    if (typeof enabled === "boolean" && !enabled) return undefined;
    if (token?.price?.value && balance?.value) {
      return balance.value
        .mul(token.price.value)
        .mul(parseUnits("1", token.price.decimals == 6 ? 12 : 0))
        .div(parseUnits("1", 18));
    }
  }, [balance, token, account]);
};
