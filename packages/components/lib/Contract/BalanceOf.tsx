import { useNetworth } from "../../context/Networth";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { Pop } from "../types";
import useLog from "../utils/hooks/useLog";
import { RenderBalance } from "./RenderBalance";

export const BalanceOf = ({ account, address, chainId }: Pop.StdProps) => {
  const { dispatch, state: _state } = useNetworth();
  const { value: stateValue, status: stateStatus } = _state.total[address || ""] || {};
  useLog({ _state }, [_state]);
  return (
    <>
      <RenderBalance account={account} address={address} chainId={chainId} />
      <FormattedBigNumber value={stateValue} decimals={18} status={stateStatus ? stateStatus : "loading"} prefix="$" />
    </>
  );
};
