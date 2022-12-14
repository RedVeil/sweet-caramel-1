import { Erc20 } from "@popcorn/components/lib";
import { useNetworth } from "@popcorn/components/context/Networth";
import { useEffect, useMemo } from "react";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { BigNumber } from "ethers";
import { Pop } from "../types";
import { ChainId } from "@popcorn/utils";
import { updatePopBalance } from "@popcorn/components/reducers/networth";

interface PopBalanceOfProps extends Pick<Pop.StdProps, "account"> {
  selectedContracts: Pop.NamedAccountsMetadata[];
}

export const PopBalanceOf = ({ selectedContracts, account }: PopBalanceOfProps) => {
  const { dispatch, state: _state } = useNetworth();

  const addPopValue = ({ value, status }) => {
    useEffect(() => {
      if (status === "success" && value) {
        updatePopBalance({
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
        {selectedContracts.map((token, i) => (
          <Erc20.BalanceOf
            account={account}
            key={`${i}:${token.chainId}:${token.address}`}
            chainId={Number(token.chainId) as unknown as ChainId}
            address={token.address}
            render={({ balance, status }) => {
              addPopValue({ value: balance?.value, status });
              return <></>;
            }}
          />
        ))}
      </div>
      <FormattedBigNumber
        value={value}
        decimals={18}
        prefix="$"
        status={selectedContracts.length === 0 || _state.popInWallet.length ? "success" : "loading"}
      />
    </>
  );
};
