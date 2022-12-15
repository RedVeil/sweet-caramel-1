import { BigNumber, constants } from "ethers";
import { useNetworth } from "../../context/Networth";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { Pop } from "../types";
import { usePrice } from "../Price";

interface TokenAmountProps extends Pop.StdProps {
  symbol: string;
}

export const TokenBalanceOf = ({ account, address, chainId, symbol }: TokenAmountProps) => {
  const { state: _state } = useNetworth();
  const { value: stateValue, status: stateStatus } = _state["total"][address || ""] || {};
  const { data: price } = usePrice({ account, address, chainId });
  let tokenAmount = BigNumber.from(0);
  if (stateStatus === "success" && stateValue && stateValue !== constants.Zero && price?.value) {
    tokenAmount = stateValue.div(price?.value);
  }
  return (
    <>
      <FormattedBigNumber value={tokenAmount} decimals={18} suffix={symbol} />
    </>
  );
};
