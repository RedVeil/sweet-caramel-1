import { BigNumber } from "ethers";
import { BigNumberWithFormatted, Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import { useEscrowBalance, useEscrowIds } from "./hooks";
import { usePrice } from "../Price";
import { useMultiStatus } from "../utils/hooks/useMultiStatus";

const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
  ({
    ...props
  }: Pop.StdProps & {
    render?: (props: {
      address?: string;
      chainId?: Number;
      price?: { value: BigNumber; decimals: number };
      balance?: BigNumberWithFormatted;
      status?: "loading" | "success" | "error" | "idle";
    }) => React.ReactElement;
  }) => {
    const { data: ids, status: idsStatus } = useEscrowIds(props);
    const { data, status: balanceStatus } = useEscrowBalance({
      ...props,
      enabled: idsStatus === "success",
      escrowIds: ids,
    });
    const { data: price, status: priceStatus } = usePrice({ ...props });
    const status = useMultiStatus([idsStatus, balanceStatus, priceStatus]);
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
    return <Component {...props} data={data} status={balanceStatus} />;
  };

export const BalanceOf = eth_call(withLoading(({ data }) => <>{data?.formatted || "$0"}</>));

export default BalanceOf;
