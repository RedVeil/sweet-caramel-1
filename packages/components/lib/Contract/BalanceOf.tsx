import { Escrow, Erc20, Staking } from "@popcorn/components/lib";
import { BigNumber, constants } from "ethers";
import { useEffect, useReducer, useState } from "react";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { Pop } from "../types";
import useLog from "../utils/hooks/useLog";

interface Entry {
  status?: string;
  value?: BigNumber;
}
interface DefaultState {
  [key: string]: Entry;
}
type Action = Entry & { key: string };
const DefaultState = {};

const reducer = (state: DefaultState, action: Action): DefaultState => {
  return {
    ...state,
    [action.key]: {
      ...action,
    },
  };
};

export const BalanceOf = ({ account, address, chainId }: Pop.StdProps) => {
  const [state, _add] = useReducer(reducer, {});
  const [{ status, data: balance }, setResult] = useState<{ status: string; data?: BigNumber }>({
    status: "idle",
    data: undefined,
  });

  const getBalance = ({ state }: { state: DefaultState }) => {
    return Object.entries(state).reduce((acc, [key, entry]) => {
      acc = entry?.status === "success" && entry.value ? acc.add(entry.value) : acc;
      return acc;
    }, constants.Zero);
  };

  const getStatus = ({ state }: { state: DefaultState }) => {
    console.log(
      "GET STATUS",
      Object.entries(state).filter(([key, entry]) => entry?.status),
    );
    const success = Object.entries(state).filter(([key, entry]) => entry?.status === "success")?.length > 0;
    return success ? "success" : "loading";
  };

  const add = ({ key, value, status }) => {
    _add({ key, value, status });
    return <></>;
  };

  useEffect(() => {
    if (status !== "success" && !balance) setResult({ status: getStatus({ state }), data: getBalance({ state }) });
  }, [state, getStatus({ state }), getBalance({ state }), status, balance]);

  useLog({ state, status, balance }, [state, status, balance]);

  return (
    <>
      <Erc20.BalanceOf
        key={`Erc20.BalanceOf`}
        account={account}
        address={address}
        chainId={chainId}
        render={({ balance, status }) => {
          useEffect(() => {
            add({ key: address, value: balance?.value, status });
          }, [balance, status]);
          return <></>;
        }}
      />
      {/* <Escrow.BalanceOf
            key={`Escrow.BalanceOf`}
            account={account}
            address={address}
            chainId={chainId}
            render={({ balance, status }) => {
              useEffect(() => {
                add({ key: address, value: balance?.value, status });
              }, [balance, status]);
              return <></>;
            }}
          /> */}
      <Escrow.ClaimableBalanceOf
        key={`Escrow.ClaimableBalanceOf`}
        account={account}
        address={address}
        chainId={chainId}
        render={({ balance, status }) => {
          useEffect(() => {
            add({ key: address, value: balance?.value, status });
          }, [balance, status]);
          return <></>;
        }}
      />
      <Escrow.VestingBalanceOf
        key={`Escrow.VestingBalanceOf`}
        account={account}
        address={address}
        chainId={chainId}
        render={({ balance, status }) => {
          useEffect(() => {
            add({ key: address, value: balance?.value, status });
          }, [balance, status]);
          return <></>;
        }}
      />
      <Staking.ClaimableBalanceOf
        key={`Staking.ClaimableBalanceOf`}
        account={account}
        address={address}
        chainId={chainId}
        render={({ balance, status }) => {
          useEffect(() => {
            add({ key: address, value: balance, status });
          }, [balance, status]);
          return <></>;
        }}
      />
      <FormattedBigNumber value={balance} decimals={18} suffix="$" /> ({status})
    </>
  );
};
