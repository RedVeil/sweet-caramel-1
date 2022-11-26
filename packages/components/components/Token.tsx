import { ChainId } from "@popcorn/utils";
import { PortfolioState, PortfolioToken } from "../reducers/portfolio";
import { networkMap } from "@popcorn/utils";
import { useComponentState, useToken } from "../hooks";
import { useUpdateToken } from "../hooks/portfolio/useUpdateToken";
import { useEffect, useMemo } from "react";

interface TokenProps {
  alias?: string;
  address: string;
  chainId: ChainId;
  account?: string;
  children?: React.ReactNode;
  updateToken?: (args: PortfolioToken | undefined) => void;
  state?: PortfolioState;
}

export const Token: React.FC<TokenProps> = ({ address, chainId, alias, account, children, updateToken, state }) => {
  const {
    data: { symbol, priceResolver, decimals, name, icons },
  } = useToken({ chainId, token: address, alias });

  const { ready, loading } = useComponentState({
    ready: !!address && !!chainId && !!address,
    loading: !account || !address,
  });

  const token = useMemo(() => state?.["tokens"]?.[chainId]?.[address], [state, chainId, address]);

  const _updateToken = useMemo(() => updateToken, [updateToken]);

  const update = ([key, val]) =>
    useUpdateToken<string>({ chainId, address, token, updateToken: _updateToken, property: [key, val] });

  useEffect(() => {
    if (ready && !loading) {
      update(["symbol", symbol]);
      update(["priceResolver", priceResolver]);
      update(["decimals", decimals]);
      update(["name", name]);
      update(["icons", icons]);
    }
  }, [ready, loading]);

  return (
    <>
      <div>Alias: {alias}</div>
      <div>Token address: {address}</div>
      <div>Price Resolver: {priceResolver || "default"}</div>
      <div>Chain: {networkMap[chainId]}</div>
      <div>Symbol: {ready && symbol}</div>
      <div>{children}</div>
      <br />
    </>
  );
};

export default Token;
