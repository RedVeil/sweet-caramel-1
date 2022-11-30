import { BigNumberWithFormatted, Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import { useApy } from "./hooks";

const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
  ({ ...props }: Pop.BaseContractProps) => {
    const { data, status } = useApy({ ...props });
    return <Component {...props} data={data} status={status} />;
  };

export const Apy = eth_call(withLoading(({ data }) => <>{data?.formatted || "n/a"}</>));

export default Apy;
