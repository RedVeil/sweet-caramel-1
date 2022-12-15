import { Escrow } from "@popcorn/components/lib";
import { useNetworth } from "@popcorn/components/context/Networth";
import { useEffect, useMemo } from "react";
import { FormattedBigNumber } from "../FormattedBigNumber";
import { BigNumber } from "ethers";
import { Pop } from "../types";
import { ChainId } from "@popcorn/utils";
import { updateVestingBalance } from "@popcorn/components/reducers/networth";

interface PopBalanceOfProps extends Pick<Pop.StdProps, "account"> {
  selectedContracts: Pop.NamedAccountsMetadata[];
}

export const TotalVestingBalanceOf = ({ selectedContracts, account }: PopBalanceOfProps) => {
  const { dispatch, state: _state } = useNetworth();

  const addVestingValue = ({ value, status }) => {
    useEffect(() => {
      if (status === "success" && value) {
        updateVestingBalance({
          value,
          status,
        })(dispatch);
      }
    }, [status, value]);
    return <></>;
  };

  const value = useMemo(() => {
    return _state.vestingBalance.reduce((acc, cur) => {
      return acc.add(cur.value);
    }, BigNumber.from(0));
  }, [_state.vestingBalance]);

  return (
    <>
      <div className="hidden">
        {selectedContracts.map((token, i) => (
          <Escrow.VestingBalanceOf
            key={`${i}:${token.chainId}:${token.address}`}
            account={account}
            address={token.address}
            chainId={Number(token.chainId) as unknown as ChainId}
            render={({ balance, status }) => {
              addVestingValue({ value: balance?.value, status });
              return <></>;
            }}
          />
        ))}
      </div>
      <FormattedBigNumber
        value={value}
        decimals={18}
        prefix="$"
        status={selectedContracts.length === 0 || _state.vestingBalance.length ? "success" : "loading"}
      />
    </>
  );
};
