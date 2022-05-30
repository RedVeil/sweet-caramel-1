import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";
import { Token } from "@popcorn/utils/src/types";
import { BigNumber, constants } from "ethers";
import useTokenAllowance from "hooks/tokens/useTokenAllowance";
import useTokenBalance from "hooks/tokens/useTokenBalance";
import { useMemo } from "react";

export default function useBalanceAndAllowance(
  token: Token | undefined,
  account: string,
  spender: string,
): { balance: BigNumber; allowance: BigNumber; revalidate: Function } {
  const {
    data: balance,
    mutate: revalidateBalance,
    isValidating: balanceIsRevalidating,
  } = useTokenBalance(token?.contract, account);
  const {
    data: allowance,
    mutate: revalidateAllowance,
    isValidating: allowanceIsRevalidating,
  } = useTokenAllowance(token?.contract, account, spender);

  const revalidate = () => {
    revalidateAllowance();
    revalidateBalance();
  };

  const response = useMemo(() => {
    if (isBigNumberish(balance) && isBigNumberish(allowance)) {
      return { balance, allowance, revalidate, isValidating: balanceIsRevalidating || allowanceIsRevalidating };
    }
    return {
      balance: constants.Zero,
      allowance: constants.Zero,
      revalidate,
      isValidating: balanceIsRevalidating || allowanceIsRevalidating,
    };
  }, [balance, allowance, new Date()]);

  return response;
}
