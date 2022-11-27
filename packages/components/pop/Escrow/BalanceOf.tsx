import { BigNumberWithFormatted } from "../types";
import { withEscrowBalanceOf } from "./withEscrowBalanceOf";
import { Pop } from "../types";

export const BalanceOf: Pop.WagmiFC<BigNumberWithFormatted> = withEscrowBalanceOf(({ data, status }) => {
  return (<div>Balance: {data?.formatted} [status: {status}]</div>);
});

export default withEscrowBalanceOf(BalanceOf);
