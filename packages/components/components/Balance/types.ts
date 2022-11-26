import { BigNumberWithFormatted } from "packages/components/reducers/portfolio";
import { BaseWalletTokenProps } from "../types";

export type BalanceProps = BaseWalletTokenProps<BigNumberWithFormatted> & {
  balance?: BigNumberWithFormatted;
  rewardsEscrowBalance?: BigNumberWithFormatted;
};
