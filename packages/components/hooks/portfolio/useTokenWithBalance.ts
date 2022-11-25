import useBalance from "./useBalance";
import useToken from "./useToken";
import { useUpdateWallet } from "./useUpdateWalletBalance";

/**
 * useTokenWithBalance hook is used to fetch a token, token metadata from named accounts, and the balance of the token for a given account
 * @param
 * @returns
 */
export const useTokenWithBalance = ({ chainId, token, account, alias, updateWallet }) => {
  const { data } = useToken({ chainId, address: token, alias });

  const { data: balance, isLoading, isError, error } = useBalance({
    enabled: !!account && !!token?.address,
    account,
    chainId,
    address: token,
  });

  useUpdateWallet?.({
    chainId,
    account,
    token,
    updateWallet,
    property: ["balance", { data, isError, error, isValidating: isLoading }],
  });

  return { data: { ...data, balance }, isLoading, isError, error };
};
