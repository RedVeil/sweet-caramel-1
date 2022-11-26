import { ChainId } from "@popcorn/utils";
import { useEscrowBalance, useNamedAccounts } from "../hooks";
import useLog from '../hooks/utils/useLog';

interface BalanceProps {
  address: string;
  chainId: ChainId;
  account?: `0x${string}`;
}

export const withEscrowBalance = (Component) => {
  const WithEscrowBalance = ({ ...props }: BalanceProps) => {
    const { address, chainId } = props;

    const [token] = useNamedAccounts(chainId.toString() as any, [address]);

    const { data, isError, isLoading, error } = useEscrowBalance({ ...props, enabled: token.balanceResolver === "rewardsEscrow" });

    useLog({ metadata: token, rewardsEscrow: data, isError, isLoading, error, address, chainId }, [data, isError, isLoading, error]);

    return (<><Component {...props} rewardsEscrowBalance={data} isError={isError} isLoading={isLoading} error={error} /></>);
  }
  return WithEscrowBalance;
}
