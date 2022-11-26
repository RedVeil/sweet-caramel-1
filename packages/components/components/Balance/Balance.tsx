import { withBalanceOf } from "./withBalanceOf";
import withLoading from "../withLoading";
import { withEscrowBalance } from "./withEscrowBalance";
import { useEffect, useMemo } from "react";
import useUpdateWallet from "../../hooks/portfolio/useUpdateWallet";
import { BalanceProps } from "./types";
import { constants } from "ethers";

const Balance_: React.FC<BalanceProps> = ({
  balance: _balance,
  escrowBalance,
  state,
  chainId,
  account,
  address,
  isLoading,
  isError,
  error,
  updateWallet,
}) => {
  const tokens = useMemo(() => state?.tokens?.[chainId], [state?.tokens, chainId]);

  const token = useMemo(() => tokens?.[address], [tokens, chainId, address]);

  const type: "rewardsEscrow" | undefined = useMemo(() => token?.balanceResolver as any, [token, chainId, address]);

  const hasBalance = useMemo(
    () => (type && type === "rewardsEscrow" ? escrowBalance?.value?.gt(0) : _balance?.value?.gt(0) || false),
    [_balance, escrowBalance, account, address, chainId, isError, isLoading, type],
  );

  const balance = useMemo(
    () =>
      type && type === "rewardsEscrow"
        ? escrowBalance || { formatted: "0", value: constants.Zero }
        : _balance || { formatted: "0", value: constants.Zero },
    [escrowBalance, _balance, account, address, chainId, isError, isLoading, type],
  );

  const update = useUpdateWallet({ token, address, account, chainId, updateWallet });

  useEffect(() => {
    update(["balance", { data: { ...balance }, isError, error, isLoading }]);
    update(["hasBalance", hasBalance]);
  }, [token]);

  return (
    <>
      <div>
        Balance: {(hasBalance && (balance?.formatted || escrowBalance?.formatted)) || "0"}{" "}
        {hasBalance ? `(${token?.asErc20?.data?.symbol})` : ""}
      </div>
    </>
  );
};

export const Balance = withBalanceOf(withEscrowBalance(withLoading(Balance_)));
export default Balance;
