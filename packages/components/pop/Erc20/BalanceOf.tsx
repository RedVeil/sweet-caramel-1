import { BigNumberWithFormatted } from "../../reducers/portfolio/reducer";
import { Pop } from "../types";
import Balance from "./Balance";
import { useBalanceOf } from "./hooks";


export const withBalanceOf = (Component: Pop.WagmiFC<BigNumberWithFormatted>) => {
  const WithBalance = ({ ...props }: Pop.BaseContractProps) => {
    const { address, chainId, account, enabled } = props;
    const { data, status } = useBalanceOf({ address, chainId, account, enabled });
    return <Component {...props} data={data} status={status} />;
  };
  return WithBalance;
};

export const BalanceOf = withBalanceOf(Balance);

export default BalanceOf;