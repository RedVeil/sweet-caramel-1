import { BigNumberWithFormatted } from "../../reducers/portfolio/reducer";
import { useBalanceValue } from "../Contract/hooks/useBalanceValue";
import { usePrice } from "../Price/hooks";
import { Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import { withLogging } from "../utils/hocs/withLogging";
import { useBalanceOf } from "./hooks";
import useLog from '../utils/hooks/useLog';

const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
    ({ ...props }: Pop.BaseContractProps) => {
      useLog("value of balance", [props]);
      const { data: balance, status: balanceStatus } = useBalanceOf(props);
      useLog({ "value of balance2": true, props }, [props]);
      const { data: price, status: priceStatus } = usePrice(props);
      useLog({ "value of balance3": true, props }, [props]);
      const { data, status } = useBalanceValue({ ...props, balance: balance?.value, price: price?.value });
      return (
        <Component
          {...props}
          data={data}
          status={!!data?.value ? "success" : balanceStatus === "loading" || priceStatus === "loading" ? "loading" : "error"}
        />
      );
    };

export const ValueOfBalance = eth_call(withLogging((withLoading(({ data }) => <>${data?.formatted || "0"}</>))));

export default ValueOfBalance;
