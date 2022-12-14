import { Escrow, Erc20, Staking } from "@popcorn/components/lib";
import { BigNumber, constants } from "ethers";
import { useNetworth } from "../../context/Networth";
import { useEffect, useReducer, useState } from "react";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { Pop } from "../types";
import useLog from "../utils/hooks/useLog";
import { updateNetworth } from "../../reducers/networth/actions";
import { usePrice } from "../Price";

interface BalanceOfProps extends Pop.StdProps {
  symbol?: string;
}

const BalanceOf = ({ account, address, chainId }: BalanceOfProps) => {
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
  return (
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
  );
};

export const TotalBalance = ({ account, address, chainId }: BalanceOfProps) => {
  const { dispatch, state: _state } = useNetworth();
  const { value: stateValue, status: stateStatus } = _state[address || ""] || {};
  return (
    <>
      <BalanceOf account={account} address={address} chainId={chainId} />
      <FormattedBigNumber value={stateValue} decimals={18} status={stateStatus ? stateStatus : "loading"} prefix="$" />
    </>
  );
};

export const TokenAmount = ({ account, address, chainId, symbol }: BalanceOfProps) => {
  const { dispatch, state: _state } = useNetworth();
  const { value: stateValue, status: stateStatus } = _state[address || ""] || {};
  const { data: price } = usePrice({ account, address, chainId });
  let tokenAmount = BigNumber.from(0);
  if (stateStatus === "success" && stateValue && stateValue !== constants.Zero && price?.value) {
    tokenAmount = stateValue.div(price?.value);
  }
  return (
    <>
      <BalanceOf account={account} address={address} chainId={chainId} />
      <FormattedBigNumber
        value={tokenAmount}
        decimals={18}
        status={stateStatus ? stateStatus : "loading"}
        suffix={symbol}
      />
    </>
  );
};
