/* eslint-disable react/display-name */
import { BigNumberWithFormatted, Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import { useApy, useEmissions } from "./hooks";

interface EmissionsProps extends Pop.BaseContractProps {
  isPop: boolean;
}
const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
    ({ ...props }: EmissionsProps) => {
      const { data, status } = useEmissions({ ...props });
      return <Component {...props} data={data} status={status} />;
    };

export const Emissions = eth_call(withLoading(({ data }) => <>{data?.formatted || "n/a"}</>));

export default Emissions;
