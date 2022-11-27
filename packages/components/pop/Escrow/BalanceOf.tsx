import { BigNumberWithFormatted, Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import { useEscrowBalance, useEscrowIds } from "./hooks";

export const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
    ({ ...props }: Pop.BaseContractProps) => {
      const { data: ids, status: idsStatus } = useEscrowIds(props);
      const { data, status } = useEscrowBalance({ ...props, enabled: idsStatus === "success", escrowIds: ids });
      return <Component {...props} data={data} status={status} />;
    };

export const BalanceOf = eth_call(withLoading(({ data }) => <>{data?.formatted || '$0'}</>));

export default BalanceOf;
