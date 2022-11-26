import { ChainId } from "packages/utils";
import { useEffect, useMemo } from "react";
import { useBalanceValue } from "../hooks/portfolio/useBalanceValue";
import { useUpdateWallet } from "../hooks/portfolio/useUpdateWallet";
import { PortfolioState, UpdateWalletBalanceActionProps } from "../reducers/portfolio";

interface BalanceValue {
  address: string;
  chainId: ChainId;
  account?: `0x${string}`;
  state?: PortfolioState;
  decimals?: number;
  updateWallet?: (args: UpdateWalletBalanceActionProps) => void;
  add?: (amount) => void;
}

export const BalanceValue: React.FC<BalanceValue> = ({ address, chainId, account, state, updateWallet }) => {
  const token = useMemo(() => state?.tokens?.[chainId]?.[address], [state?.tokens, chainId, address]);

  const wallet = useMemo(
    () => (!!account && state?.wallet?.[account]?.[chainId]?.[address]) || undefined,
    [state, chainId, account, address],
  );

  const [price, balance] = useMemo(
    () => [token?.price?.data, wallet?.balance?.data],
    [token?.price?.data, wallet?.balance?.data],
  );

  const enabled = useMemo(
    () => !!address && !!chainId && !!account && !!price && !!balance,
    [address, chainId, account, price, balance],
  );

  const { data, isLoading, error, isError } = useBalanceValue({
    enabled,
    address,
    chainId,
    price: price?.value,
    account,
    balance: balance?.value,
  });

  const update = useUpdateWallet({ token, address, account, chainId, updateWallet });

  useEffect(() => {
    if (token && enabled && (data || error)) {
      update(["balanceValue", { data, isError, error, isLoading }]);
      update(["balanceFetched", Date.now()]);
    }
  }, [token, balance, price, enabled]);

  return <>{<div>Balance Value: ${data?.formatted} </div>}</>;
};

export default BalanceValue;
