import useBalance from "./useBalance";
import { useBalanceValue } from "./useBalanceValue";
import useToken from "./useToken";

/**
 * useTokenWithBalance hook is used to fetch a token, token metadata from named accounts, and the balance of the token for a given account
 * @param
 * @returns
 */
export const useTokenWithBalance = ({ chainId, token, account, alias }) => {
  const { data } = useToken({ chainId, token, alias });

  const { data: balance, isLoading, isError, error } = useBalance({
    enabled: !!account && !!token?.address,
    account,
    chainId,
    alias,
    token: token?.address,
  });

  const value = useBalanceValue({ balance, token, account });

  return { data: { ...data, balance, value }, isLoading, isError, error };
};
