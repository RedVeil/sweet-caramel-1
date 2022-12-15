import { useNetworth } from "../../context/Networth";
import { BigNumber } from "ethers";
import { useMemo } from "react";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { Pop } from "../types";

interface TotalBalanceOfProps extends Pick<Pop.StdProps, "account"> {
  selectedContracts: Pop.NamedAccountsMetadata[];
}

export const TotalBalanceOf = ({ account, selectedContracts }: TotalBalanceOfProps) => {
  const { state: _state } = useNetworth();

  const totalPopBalance = useMemo(() => {
    return _state.popInWallet.reduce((acc, cur) => {
      return acc.add(cur.value);
    }, BigNumber.from(0));
  }, [_state.popInWallet]);

  const totalVestingBalance = useMemo(() => {
    return _state.vestingBalance.reduce((acc, cur) => {
      return acc.add(cur.value);
    }, BigNumber.from(0));
  }, [_state.vestingBalance]);

  const status = useMemo(() => {
    return selectedContracts.length === 0 || (_state.vestingBalance.length && _state.popInWallet.length)
      ? "success"
      : "loading";
  }, [selectedContracts, _state.vestingBalance, _state.popInWallet]);

  return (
    <>
      <FormattedBigNumber value={totalPopBalance.add(totalVestingBalance)} decimals={18} status={status} prefix="$" />
    </>
  );
};
