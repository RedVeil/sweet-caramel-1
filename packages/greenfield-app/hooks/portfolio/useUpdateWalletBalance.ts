import { useEffect } from "react";

export const useUpdateWalletBalance = ({ token, account, value, balance, wallet, chainId, updateWallet }) => {
  // TODO update isLoading and error states as well. before i was having some trouble doing this and ran into infinite loops, but i think the solution is to memoize the wallet object and pass that memoized value to the dependencies array

  useEffect(() => {
    if (
      !!token &&
      !!account &&
      !!value &&
      !!balance?.value &&
      wallet?.balance?.toString() !== balance?.value?.toString() &&
      wallet?.value?.toString() !== value.toString()
    ) {
      updateWallet({
        chainId,
        account,
        value,
        token: token.address,
        balance: balance.value,
        hasBalance: balance.value.gt(0),
      });
    }
  }, [balance, value]);
};
