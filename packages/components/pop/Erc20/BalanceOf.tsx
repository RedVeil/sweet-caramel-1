import { BigNumberWithFormatted } from "../../reducers/portfolio/reducer";
import { Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import { useBalanceOf } from "./hooks";

const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
  ({ ...props }: Pop.BaseContractProps) => {
    const { data, status } = useBalanceOf(props);
    return <Component {...props} data={data} status={status} />;
  };

export const BalanceOf = eth_call(withLoading(({ data }) => <>{data?.formatted}</>));

export default BalanceOf;
