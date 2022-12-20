import type { Pop } from "../types";
import { BigNumber, constants } from "ethers";
import { useAccount } from "wagmi";
import { useState } from "react";

import { networkMap } from "@popcorn/utils";
import { Erc20, Contract } from "@popcorn/components/lib";
import useContractMetadata from "./hooks/useContractMetadata";

interface ContractProps extends Pop.NamedAccountsMetadata {
  alias?: string;
  children?: React.ReactElement[];
  index?: number;
  callback?: (value?: BigNumber) => void;
  networth?: BigNumber;
}

const HUNDRED = BigNumber.from(100);
export const Metadata: Pop.FC<ContractProps> = ({ address, chainId, children, alias, index, callback, networth }) => {
  const [balance, setBalance] = useState<BigNumber>();
  const { address: account } = useAccount();
  const { data, status } = useContractMetadata({ chainId, address, alias });

  const { symbol, priceResolver, apyResolver, balanceResolver, decimals, name, icons, alias: _alias } = data || {};

  function handleCallback(value: any) {
    const setHolderBalance = !balance && value;
    if (setHolderBalance) {
      callback!(value);
      setBalance(value);
    }
  }

  const balanceGtZero = balance?.gt(0);
  const portfolioDistribution = networth && balanceGtZero ? HUNDRED.mul(balance!).div(networth) : constants.Zero;

  return (
    <div className={balanceGtZero ? "" : "hidden"}>
      <h2>
        {index}: {alias}
      </h2>
      <div>
        {index}: Alias: {alias}
      </div>
      <div>
        {index}: Chain: {networkMap[chainId]}
      </div>
      <div>
        {index}: Contract address: {address}
      </div>
      <div>
        {index}: Price Resolver: {priceResolver || "default"}
      </div>
      <div>
        {index}: Portfolio {portfolioDistribution.toString()}%
      </div>
      <div>
        {index}: Apy Resolver: {apyResolver || "default"}
      </div>
      <div>
        {index}: Balance Resolver: {balanceResolver || "default"}
      </div>
      <div>
        {index}: Symbol: {symbol || "n/a"}
      </div>
      <div>
        {index}: Icons: {(icons && icons.length > 0 && `${`[` + icons.join(", ") + `]`}`) || ""}
      </div>
      <div>
        <div>
          Erc20.BalanceOf:
          {symbol}
          <Erc20.BalanceOf key={`Erc20.BalanceOf`} account={account} address={address} chainId={chainId} />
        </div>

        <Erc20.BalanceOf
          key={`Erc20.BalanceOfValue`}
          account={account}
          address={address}
          chainId={chainId}
          render={({ balance, price, status }) => {
            return (
              <div>
                Erc20.BalanceOfValue:{" "}
                <Contract.Value
                  balance={balance?.value}
                  price={price?.value}
                  status={status}
                  callback={handleCallback}
                />
              </div>
            );
          }}
        />

        <div>
          Contract.TVL: <Contract.Tvl key={`Contract.TVL`} address={address} chainId={chainId} />
        </div>
      </div>

      <br />
    </div>
  );
};

export default Metadata;
