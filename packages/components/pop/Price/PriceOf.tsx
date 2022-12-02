import { usePrice } from "./hooks/usePrice";
import { BigNumberWithFormatted, Pop } from "../types";
import withLoading from "../utils/hocs/withLoading";

const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
  ({ ...props }: Pop.BaseContractProps) => {
    const { data, status } = usePrice({ ...props });
    return <Component {...props} data={data} status={status} />;
  };

export const PriceOf = eth_call(withLoading(({ data }) => <>${data?.formatted || "0"}</>));

export default PriceOf;
