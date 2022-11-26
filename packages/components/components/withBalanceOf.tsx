import { ChainId } from "@popcorn/utils";
import { useBalanceOf } from "../hooks/portfolio/useBalanceOf";

interface BalanceProps {
  address: string;
  chainId: ChainId;
  account?: `0x${string}`;
}

export const withBalanceOf = (Component) => {
  const WithBalanceOf = ({ ...props }: BalanceProps) => {
    const { address, chainId, account } = props;

    const { data, isError, isLoading, error } = useBalanceOf({ address, chainId, account });

    return (<><Component {...props} balance={data} isError={isError} isLoading={isLoading} error={error} /></>);
  }
  return WithBalanceOf;
}
