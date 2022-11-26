import { useEscrowBalance, useNamedAccounts } from "../../hooks";
import useLog from "../../hooks/utils/useLog";
import { BalanceProps } from "./types";

export const withEscrowBalance = (Component) => {
  const WithEscrowBalance = ({ ...props }: BalanceProps) => {
    const { address, chainId } = props;

    const [token] = useNamedAccounts(chainId.toString() as any, [address]);

    const { data, isError, isLoading, error } = useEscrowBalance({
      ...props,
      enabled: token.balanceResolver === "rewardsEscrow",
    });

    useLog({ metadata: token, rewardsEscrow: data, isError, isLoading, error, address, chainId }, [
      data,
      isError,
      isLoading,
      error,
    ]);

    return (
      <>
        <Component {...props} escrowBalance={data} isError={isError} isLoading={isLoading} error={error} />
      </>
    );
  };
  return WithEscrowBalance;
};
