import { networkMap } from "@popcorn/utils";
import { useComponentState } from "../utils/hooks";
import { Pop } from "../types";
import useContractMetadata from "./hooks/useContractMetadata";
import { Escrow, Erc20, Price, Contract, Staking } from "@popcorn/components/lib";
import { BigNumber, constants } from "ethers";
import { useAccount } from "wagmi";
import { useBalanceOf } from "../Erc20/hooks";
import { useState } from "react";

interface ContractProps extends Pop.NamedAccountsMetadata {
  alias?: string;
  children?: React.ReactElement[];
  index?: number;
  callback?: (value?: BigNumber) => void;
}

export const Metadata: Pop.FC<ContractProps> = ({ address, chainId, children, alias, index, callback }) => {
  const [showItem, setShowItem] = useState(false);
  const { address: account } = useAccount();
  // const account = "0x22f5413C075Ccd56D575A54763831C4c27A37Bdb";
  const { data, status } = useContractMetadata({ chainId, address, alias });

  const { symbol, priceResolver, apyResolver, balanceResolver, decimals, name, icons, alias: _alias } = data || {};

  return (
    <div className={showItem ? "" : "hidden"}>
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
            const setHolderBalance = !showItem && balance?.value;
            if (setHolderBalance && balance?.value?.gt(0)) {
              setShowItem(true);
            }
            function handleCallback(value: any) {
              if (setHolderBalance) callback!(value);
            }
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
