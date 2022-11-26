import { BigNumber, constants } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ChainId } from "packages/utils";
import { useMemo } from "react";
import { formatAndRoundBigNumber } from "../../../utils/src/formatBigNumber";
import { BigNumberWithFormatted, PortfolioTokenAsyncProperty } from "../../reducers/portfolio/reducer";

/**
 * useBalanceValue hook is used to calculate the value of an account balance of a given token
 * @returns value of balance in USD terms based on token price
 */
interface UseBalanceValueProps {
  price?: BigNumber;
  balance?: BigNumber;
  account?: string;
  chainId: ChainId;
  address: string;
  enabled?: boolean;
  decimals?: number;
}
export const useBalanceValue = ({
  price,
  balance,
  account,
  enabled,
  address,
  chainId,
  decimals = 18,
}: UseBalanceValueProps): PortfolioTokenAsyncProperty<BigNumberWithFormatted> => {
  return useMemo(() => {
    const empty = { data: { value: undefined, formatted: undefined }, isLoading: false, isError: false };
    if (typeof enabled === "boolean" && !enabled) return empty;
    if (price && balance) {
      const value = balance
        .mul(price)
        .mul(parseUnits("1", decimals == 6 ? 12 : 0))
        .div(parseUnits("1", 18));
      return {
        data: { value, formatted: value && formatAndRoundBigNumber(value, 18) },
        isValidating: !!account && !!enabled && !value,
      };
    }
    return empty;
  }, [balance, price, account, address, chainId]);
};
