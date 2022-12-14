import { useNetworth } from "../../context/Networth";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { Pop } from "../types";
import { RenderBalance } from "./RenderBalance";

export const BalanceOf = ({ account, address, chainId }: Pop.StdProps) => {
  const { dispatch, state: _state } = useNetworth();
  const { value: stateValue, status: stateStatus } = _state[address || ""] || {};
  return (
    <>
      <RenderBalance account={account} address={address} chainId={chainId} />
      <FormattedBigNumber value={stateValue} decimals={18} status={stateStatus ? stateStatus : "loading"} prefix="$" />
    </>
  );
};
