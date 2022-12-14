import { Escrow, Erc20, Staking } from "@popcorn/components/lib";
import { BigNumber, constants } from "ethers";
import { useNetworth } from "../../context/Networth";
import { useEffect, useReducer, useState } from "react";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { Pop } from "../types";
import useLog from "../utils/hooks/useLog";
import { updateNetworth } from "../../reducers/networth/actions";
import { usePrice } from "../Price";

export const BalanceOf = ({ account, address, chainId }: Pop.StdProps) => {
  const { dispatch, state: _state } = useNetworth();
  useLog({ address, _state }, [address, _state]);

  const addNetworth = ({ key, value, status }) => {
    useEffect(() => {
      if (status === "success" && value) {
        updateNetworth({
          key: address || "",
          value,
          status,
        })(dispatch);
      }
    }, [status]);
    return <></>;
  };

  const { value: stateValue, status: stateStatus } = _state[address || ""] || {};
  const { data: price } = usePrice({ account, address, chainId });
  if (stateStatus === "success" && stateValue && stateValue !== constants.Zero && price?.value) {
    let tokenAmount = stateValue.div(price?.value);
    console.log("tokenAmount", tokenAmount);
  }

  return (
    <>
      <div className="hidden">
        <Erc20.BalanceOf
          key={`Erc20.BalanceOf`}
          account={account}
          address={address}
          chainId={chainId}
          render={({ balance, status }) => {
            addNetworth({ key: address || "", value: balance?.value, status });
            return <></>;
          }}
        />
        <Escrow.BalanceOf
          key={`Escrow.BalanceOf`}
          account={account}
          address={address}
          chainId={chainId}
          render={({ balance, status }) => {
            addNetworth({ key: address || "", value: balance?.value, status });
            return <></>;
          }}
        />
        <Escrow.ClaimableBalanceOf
          key={`Escrow.ClaimableBalanceOf`}
          account={account}
          address={address}
          chainId={chainId}
          render={({ balance, status }) => {
            addNetworth({ key: address || "", value: balance?.value, status });
            return <></>;
          }}
        />
        <Escrow.VestingBalanceOf
          key={`Escrow.VestingBalanceOf`}
          account={account}
          address={address}
          chainId={chainId}
          render={({ balance, status }) => {
            addNetworth({ key: address || "", value: balance?.value, status });
            return <></>;
          }}
        />
        <Staking.ClaimableBalanceOf
          key={`Staking.ClaimableBalanceOf`}
          account={account}
          address={address}
          chainId={chainId}
          render={({ balance, status }) => {
            addNetworth({ key: address || "", value: balance, status });
            return <></>;
          }}
        />
      </div>
      <FormattedBigNumber value={stateValue} decimals={18} prefix="$" status={stateStatus ? stateStatus : "loading"} />
    </>
  );
};
