import { Escrow, Erc20, Staking } from "@popcorn/components/lib";
import { useNetworth } from "../../context/Networth";
import { useEffect } from "react";
import { Pop } from "../types";
import useLog from "../utils/hooks/useLog";
import { updateNetworth } from "../../reducers/networth/actions";

export const RenderBalance = ({ account, address, chainId }: Pop.StdProps) => {
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
