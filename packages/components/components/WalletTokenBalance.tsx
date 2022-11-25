import { ChainId } from "@popcorn/utils";
import { UpdateWalletBalanceActionProps } from "../reducers/portfolio";
import { networkMap } from "@popcorn/utils";
import withValue from "./withValue";
import { useComponentState, useToken } from "../hooks";

interface WalletTokenBalanceProps {
  alias: string;
  token: string;
  chainId: ChainId;
  updateWallet?: (args: UpdateWalletBalanceActionProps) => void;
  account?: string;
  children?: React.ReactNode;
}

export const WalletTokenBalance: React.FC<WalletTokenBalanceProps> = ({
  token,
  chainId,
  alias,
  account,
  children,
  updateWallet
}) => {

  const { data: { symbol, address, priceResolver } } = useToken({ chainId, token, alias });


  const { ready, loading } = useComponentState({
    ready: !!address && !!chainId && !!token,
    loading: !account || !address,
  });

  return (
    <>
      <div>Alias: {alias}</div>
      <div>Token address: {address}</div>
      <div>Price Resolver: {priceResolver || "default"}</div>
      <div>Chain: {networkMap[chainId]}</div>
      <div>Symbol: {ready && symbol}</div>
      <div>
        {children}
      </div>
      <br />
    </>
  );
};

export const WalletTokenWithBalanceValue = withValue(WalletTokenBalance);
