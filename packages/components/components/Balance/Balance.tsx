import { withBalanceOf } from "./withBalanceOf";
import withLoading from "../withLoading";
import { withEscrowBalance } from "./withEscrowBalance";
import { useEffect, useMemo } from "react";
import useUpdateWallet from "../../hooks/portfolio/useUpdateWallet";
import { BalanceProps } from "./types";

const Balance_: React.FC<BalanceProps> = ({
  balance: _balance,
  rewardsEscrowBalance,
  state,
  chainId,
  account,
  address,
  isLoading,
  isError,
  error,
  updateWallet,
}) => {
  const hasBalance = _balance?.value?.gt(0) || rewardsEscrowBalance?.value?.gt(0);

  const balance = useMemo(() => _balance && _balance || rewardsEscrowBalance, [rewardsEscrowBalance, _balance]);

  const token = useMemo(() => state?.tokens?.[chainId]?.[address], [state, chainId, address]);

  const update = useUpdateWallet({ token, address, account, chainId, updateWallet });

  useEffect(() => {
    if (balance) {
      update(["balance", { data: { ...balance }, isError, error, isLoading }]);
      update(["hasBalance", hasBalance]);
    }
  }, [token, hasBalance]);

  return (
    <>
      <div>
        Balance: {balance?.formatted || rewardsEscrowBalance?.formatted || "0"}{" "}
        {hasBalance ? `(${token?.asErc20?.data?.symbol})` : ""}
      </div>
    </>
  );
};

export const Balance = withEscrowBalance(withBalanceOf(withLoading(Balance_)));
export default Balance;
