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

  const token = useMemo(() => state?.tokens?.[chainId]?.[address], [state, chainId, address]);
  const [price, balance] = [token?.price?.data, token?.balance?.data];

  const { data, isLoading, error, isError } = useBalanceValue({
    enabled: !!address && !!chainId && !!account && !!price && !!balance,
    address,
    chainId,
    price: price?.value,
    account,
    balance: balance?.value,
  });

  const update = useUpdateWallet({ token, address, account, chainId, updateWallet });

  useEffect(() => {
    if (token && balance && price) {
      update(["balanceValue", { data, isError, error, isLoading }]);
    }
  }, [token, balance, price]);

  return (
    <>
      {<div>Balance Value: {data?.formatted} </div>}
    </>
  );
};

export default BalanceValue;
