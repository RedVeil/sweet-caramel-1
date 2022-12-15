import { Pop } from "../types";
import useTvl from "./hooks/useTvl";
import { BigNumber, constants } from "ethers";

interface PercentBalanceOfProps extends Pop.StdProps {
  balance: BigNumber;
}

export const PercentBalanceOf = ({ account, address, chainId, balance }: PercentBalanceOfProps) => {
  const { data, status } = useTvl({ address, chainId });
  let percentBalance: BigNumber = constants.Zero;
  if (data?.value && balance) {
    const OneE18 = BigNumber.from("1000000000000000000");
    let _balance = balance.mul(OneE18);
    let multipliedBalance = _balance.div(data?.value).mul(BigNumber.from(100));
    percentBalance = multipliedBalance.div(OneE18);
  }

  return <>{percentBalance.toString()}%</>;
};
