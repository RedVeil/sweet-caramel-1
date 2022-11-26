import { useCallback, useMemo } from "react";
import { PortfolioToken, PortfolioTokenAsyncProperty } from "../../reducers/portfolio/reducer";

type PortfolioTokenKey = keyof Omit<PortfolioToken, "address" | "chainId">;
type PortfolioTokenValue<T> = PortfolioTokenAsyncProperty<T> | T;
type UseUpdateToken<T> = {
  chainId: number;
  address?: string;
  token?: PortfolioToken;
} & { updateToken?: (action: PortfolioToken) => void };

export function useUpdateToken<T>({ chainId, address, token: _token, updateToken }: UseUpdateToken<T>) {
  const token = useMemo(() => _token, [_token, chainId, address]);

  return useCallback(
    (property: [PortfolioTokenKey, PortfolioTokenValue<T>]) => {
      let [key, value] = property;

      if (!token || (!!chainId && !!token && !!updateToken && !!property)) {
        console.log({ token, chainId, property });
        if (!token?.[key] || (token?.[key]?.toString() !== value?.toString() && !!value)) {
          console.log({ updating: true, address, chainId, token, key, value });
          !!address && updateToken?.({ chainId, address, [key]: value });
        }
      }
    },
    [chainId, address, token, updateToken],
  );
}

export default useUpdateToken;
