import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { useUpdateWalletBalance } from "hooks/portfolio/useUpdateWalletBalance";
import { PortfolioToken, UpdateWalletBalanceActionProps } from "reducers/portfolio";
import { networkMap } from "../../../utils/src/connectors";
import { PortfolioState } from "../../reducers/portfolio";
import { useTokenWithBalance } from "../../hooks/portfolio/useTokenWithBalance";

interface WalletTokenBalanceProps {
  alias: string;
  token: PortfolioToken;
  chainId: ChainId;
  state: PortfolioState;
  updateWallet: (args: UpdateWalletBalanceActionProps) => void;
  account?: string;
  children?: React.ReactNode;
}

export const WalletTokenBalance: React.FC<WalletTokenBalanceProps> = ({
  token,
  chainId,
  alias,
  state,
  updateWallet,
  account,
  children,
}) => {
  const wallet = state.wallet[chainId]?.[account]?.[token?.address];

  const {
    data: { address, priceResolver, value, balance, symbol, decimals },
    isLoading,
  } = useTokenWithBalance({ chainId, token, account, alias });

  useUpdateWalletBalance({ token, account, value, balance, wallet, chainId, updateWallet });

  return (
    <>
      <div>Alias: {alias}</div>
      <div>Token address: {address}</div>
      <div>Price Resolver: {priceResolver || "default"}</div>
      <div>Chain: {networkMap[chainId]}</div>
      <div>Symbol: {symbol}</div>
      <div>Price: {children}</div>
      <div>
        Balance:{" "}
        {(isLoading && "Loading ...") || (balance?.value && formatAndRoundBigNumber(balance.value, decimals)) || ""}
        {` ${(balance?.value?.gt(0) && symbol && `(${symbol})`) || ""}`}
      </div>

      <div>Value: {(value && `$${formatAndRoundBigNumber(value, decimals)}`) || (account && "Loading ...") || ""}</div>
      <br />
    </>
  );
};
