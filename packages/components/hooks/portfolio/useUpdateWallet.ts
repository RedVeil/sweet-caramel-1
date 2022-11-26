import { useEffect } from "react";
import { UpdateWalletBalanceActionProps } from "../../reducers/portfolio/actions";
import { PortfolioToken, PortfolioTokenAsyncProperty } from "../../reducers/portfolio/reducer";

type UseUpdateWallet<T> = {
  chainId: number;
  token: string;
  account?: string;
  property: [keyof PortfolioToken, PortfolioTokenAsyncProperty<T>];
} & { updateWallet?: (action: UpdateWalletBalanceActionProps) => void };

export function useUpdateWallet<T>({
  chainId,
  account,
  token,
  property: [key, value],
  updateWallet,
}: UseUpdateWallet<T>) {
  // TODO update isLoading and error states as well. before i was having some trouble doing this and ran into infinite loops, but i think the solution is to memoize the wallet object and pass that memoized value to the dependencies array

  useEffect(() => {
    if (!!chainId && !!account && !!token && !!updateWallet) {
      updateWallet?.({
        chainId,
        account,
        token,
        [key]: value,
      });
    }
  }, [account, chainId, token, key, value]);
}

export default useUpdateWallet;
