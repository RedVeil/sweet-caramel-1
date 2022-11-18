import { useEffect } from "react";

export const useUpdateWalletBalance = ({ token, account, value, balance, wallet, chainId, updateWallet }) => {
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
