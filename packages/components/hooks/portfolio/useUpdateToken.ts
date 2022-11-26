import { useEffect, useMemo, useState } from "react";
import { PortfolioToken, PortfolioTokenAsyncProperty } from "../../reducers/portfolio/reducer";
import useLog from "../utils/useLog";

type PortfolioTokenKey = keyof Omit<PortfolioToken, "address" | "chainId">;
type PortfolioTokenValue<T> = PortfolioTokenAsyncProperty<T> | T;
type UseUpdateToken<T> = {
  chainId: number;
  address?: string;
  token?: PortfolioToken;
  property?: [PortfolioTokenKey, PortfolioTokenValue<T>];
  properties?: [PortfolioTokenKey, PortfolioTokenValue<T>][];
} & { updateToken?: (action: PortfolioToken) => void };

export function useUpdateToken<T>({ chainId, address, token: _token, property, updateToken }: UseUpdateToken<T>) {
  // TODO update isLoading and error states as well. before i was having some trouble doing this and ran into infinite loops, but i think the solution is to memoize the wallet object and pass that memoized value to the dependencies array
  const token = useMemo(() => _token, [_token, chainId, address]);

  let [key, value] = property as [PortfolioTokenKey, PortfolioTokenValue<T>];

  useLog({ useUpdateToken: { chainId, address, token, property, updateToken } });

  useEffect(() => {
    if (!token || (!!chainId && !!token && !!updateToken && !!property)) {
      if (!token?.[key] || token?.[key] !== value) {
        !!address && updateToken?.({ chainId, address, [key]: value });
      }
    }
  }, [property]);
}

export default useUpdateToken;
