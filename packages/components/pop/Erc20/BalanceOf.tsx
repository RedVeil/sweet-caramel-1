import { BigNumber } from "ethers";
import { BigNumberWithFormatted } from "../../reducers/portfolio/reducer";
import { usePrice } from "../Price";
import { Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import { useBalanceOf } from "./hooks";

const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
  ({
    ...props
  }: Pop.StdProps & {
    render?: (
      props: {
        price?: { value: BigNumber; decimals: number };
        balance?: BigNumberWithFormatted;
        status?: "loading" | "success" | "error" | "idle";
      } & Pop.StdProps,
    ) => React.ReactElement;
  }) => {
    const { data, status } = useBalanceOf(props);
    const { data: price } = usePrice({ ...props });
    if (props.render) {
      return (
        <>
          {props.render({
            balance: data,
            price: price,
            status: status,
            ...props,
          })}
        </>
      );
    }
    return <Component {...props} data={data} status={status} />;
  };

export const BalanceOf = eth_call(withLoading(({ data }) => <>{data?.formatted}</>));

export default BalanceOf;
