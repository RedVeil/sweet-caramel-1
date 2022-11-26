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

export const Token: React.FC<TokenProps> = ({ address, chainId, alias, children, updateToken, state }) => {
  const {
    data: { symbol, priceResolver, apyResolver, decimals, name, icons },
    isLoading,
    error,
    isError,
  } = useToken({ chainId, token: address, alias });

  const token = useMemo(() => state?.tokens?.[chainId]?.[address], [state?.tokens?.[chainId]?.[address], chainId, address]);

  const update = useUpdateToken({ chainId, address, token, updateToken });

  useEffect(() => {
    update(["isLoading", isLoading]);
    update(["error", error]);
    update(["isError", isError]);
  }, [isLoading, error, isError]);

  useEffect(() => {
    update(["asErc20", { data: { symbol, name, decimals } }], symbol && name && decimals);
    update(["priceResolver", priceResolver], !token?.priceResolver !== !priceResolver);
    update(["icons", icons], !token?.icons !== !icons);
    update(["alias", alias], !token?.alias !== !alias);
  }, [symbol, decimals, name, isLoading]);

  const { ready } = useComponentState(
    {
      ready: !!address && !!chainId && !!address,
      loading: !address || isLoading,
    },
    [address, chainId],
  );

  return (
    <>
      <div>Alias: {alias}</div>
      <div>Token address: {address}</div>
      <div>Price Resolver: {priceResolver || "default"}</div>
      <div>Apy Resolver: {apyResolver || "default"}</div>
      <div>Chain: {networkMap[chainId]}</div>
      <div>Symbol: {ready && symbol}</div>
      <div>{children}</div>
      <br />
    </>
  );
};

export default Token;
