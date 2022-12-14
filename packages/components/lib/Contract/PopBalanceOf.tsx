import { Erc20 } from "@popcorn/components/lib";
import { useNetworth } from "../../context/Networth";
import { useEffect, useMemo } from "react";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { BigNumber } from "ethers";
import { Pop } from "../types";
import useLog from "../utils/hooks/useLog";
import { updatePopInWallet } from "../../reducers/networth/actions";

export const PopBalanceOf = ({ account, address, chainId }: Pop.StdProps) => {
  const { dispatch, state: _state } = useNetworth();
  useLog({ address, _state }, [address, _state]);

  const addPopValue = ({ key, value, status }) => {
    useEffect(() => {
      if (status === "success" && value) {
        updatePopInWallet({
          value,
          status,
        })(dispatch);
      }
    }, [status, value]);
    return <></>;
  };

  const value = useMemo(() => {
    return _state.popInWallet.reduce((acc, cur) => {
      return acc.add(cur.value);
    }, BigNumber.from(0));
  }, [_state.popInWallet]);

  return (
    <>
      <div className="hidden">
        <Erc20.BalanceOf
          key={`Erc20.BalanceOf`}
          account={account}
          address={address}
          chainId={chainId}
          render={({ balance, status }) => {
            addPopValue({ key: address || "", value: balance?.value, status });
            return <></>;
          }}
        />
      </div>
      <FormattedBigNumber
        value={value}
        decimals={18}
        prefix="$"
        status={_state.popInWallet.length ? "success" : "loading"}
      />
    </>
  );
};
