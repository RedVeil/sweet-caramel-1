import { useCallback, useMemo } from "react";
import { PortfolioToken, PortfolioTokenAsyncProperty } from "../../reducers/portfolio/reducer";
import { UpdateWalletBalanceActionProps } from "../../reducers/portfolio/actions";

type PortfolioTokenKey = keyof Omit<PortfolioToken, "address" | "chainId">;
type PortfolioTokenValue<T> = PortfolioTokenAsyncProperty<T> | T;
type UseUpdateWalletProps = {
  chainId: number;
  account?: string;
  address?: string;
  token?: PortfolioToken;
} & { updateWallet?: (action: UpdateWalletBalanceActionProps) => void };

export function useUpdateWallet({ chainId, address, account, token: _token, updateWallet }: UseUpdateWalletProps) {
  const token = useMemo(() => _token, [_token, chainId, address]);

  return useCallback(
    <T>(property: [PortfolioTokenKey, PortfolioTokenValue<T>]) => {
      let [key, value] = property;

      if (!token || (!!chainId && !!token && !!updateWallet && !!property)) {
        console.log({ token, chainId, property });
        if (!token?.[key] || (token?.[key]?.toString() !== value?.toString() && !!value)) {
          !!address && updateWallet?.({ chainId, token: address, account, [key]: value });
        }
      }
    },
    [chainId, address, token, updateWallet],
  );
}

export default useUpdateWallet;
