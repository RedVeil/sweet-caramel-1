import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";
import { Token } from "@popcorn/utils/src/types";
import { BigNumber } from "ethers";
import useTokenAllowance from "hooks/tokens/useTokenAllowance";
import useTokenBalance from "hooks/tokens/useTokenBalance";
import { useBlockNumber } from "hooks/useBlockNumber";
import { useMemo } from "react";

export default function useBalanceAndAllowance(
  token: Token | undefined,
  account: string,
  spender: string,
): { balance: BigNumber; allowance: BigNumber; revalidate: Function } {
  const {
    data: balance,
    revalidate: revalidateBalance,
    isValidating: balanceIsRevalidating,
  } = useTokenBalance(token?.contract, account);
  const {
    data: allowance,
    revalidate: revalidateAllowance,
    isValidating: allowanceIsRevalidating,
  } = useTokenAllowance(token?.contract, account, spender);
  const blockNumber = useBlockNumber();

  const revalidate = () => {
    revalidateAllowance();
    revalidateBalance();
  };

  const response = useMemo(() => {
    if (isBigNumberish(balance) && isBigNumberish(allowance)) {
      return { balance, allowance, revalidate, isValidating: balanceIsRevalidating || allowanceIsRevalidating };
    }
    return {
      balance: BigNumber.from("0"),
      allowance: BigNumber.from("0"),
      revalidate,
      isValidating: balanceIsRevalidating || allowanceIsRevalidating,
    };
  }, [balance, allowance, new Date()]);

  return response;
}
