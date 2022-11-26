import { useBalanceOf } from "../../hooks/portfolio/useBalanceOf";
import { BalanceProps } from "./types";


export const withBalanceOf = (Component) => {
  const WithBalanceOf = ({ ...props }: BalanceProps) => {
    const { address, chainId, account } = props;

    const { data, isError, isLoading, error } = useBalanceOf({ address, chainId, account });

    return (<><Component {...props} balance={data} isError={isError} isLoading={isLoading} error={error} /></>);
  }
  return WithBalanceOf;
}
