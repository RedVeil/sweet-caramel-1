import { BigNumberWithFormatted } from "packages/components/reducers/portfolio";
import { Pop } from "../types";

export const Balance: Pop.WagmiFC<BigNumberWithFormatted> = ({ data, status }) => {
  return (<div>Balance: {data?.formatted} [status: {status}]</div>);
};

export default Balance;