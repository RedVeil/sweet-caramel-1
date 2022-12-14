import { Pop } from "../types";
import useTvl from "./hooks/useTvl";
import { BigNumber, constants } from "ethers";
import { FormattedBigNumber } from "../FormattedBigNumber";
import useLog from "../utils/hooks/useLog";

interface PercentBalanceOfProps extends Pop.StdProps {
  balance: BigNumber;
}

export const PercentBalanceOf = ({ account, address, chainId, balance }: PercentBalanceOfProps) => {
  const { data, status } = useTvl({ address, chainId });
  let percentBalance: BigNumber = constants.Zero;
  if (data?.value && balance) {
    const ie8 = BigNumber.from("1000000000000000000");
    // percentBalance = ((balance.mul(ie8)).div(data?.value.mul(ie8)));
    let b = balance.mul(ie8);
    let t = data?.value.mul(ie8);
    percentBalance = b.div(t);
    console.log("percentBalance", address, b, t, percentBalance);
  }
  useLog({ address, data, balance, percentBalance }, [address, data, balance, percentBalance]);

  return <>{percentBalance.toString()}%</>;
};
