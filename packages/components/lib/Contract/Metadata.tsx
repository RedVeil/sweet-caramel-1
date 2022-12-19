import { networkMap } from "@popcorn/utils";
import { useComponentState } from "../utils/hooks";
import { Pop } from "../types";
import useContractMetadata from "./hooks/useContractMetadata";
import { Escrow, Erc20, Price, Contract, Staking } from "@popcorn/components/lib";
import { BigNumber, constants } from "ethers";
import { useAccount } from "wagmi";
import { useBalanceOf } from "../Erc20/hooks";

interface ContractProps extends Pop.NamedAccountsMetadata {
  alias?: string;
  children?: React.ReactElement[];
  index?: number;
  callback?: (value?: BigNumber) => void;
}

export const Metadata: Pop.FC<ContractProps> = ({ address, chainId, children, alias, index, callback }) => {
  const { address: account } = useAccount();

  const { data, status } = useContractMetadata({ chainId, address, alias });

  const { symbol, priceResolver, apyResolver, balanceResolver, decimals, name, icons, alias: _alias } = data || {};

  const { data: balance, status: balStatus } = useBalanceOf({ chainId, address, account });

  const { ready } = useComponentState({
    ready: !!data && !!balance,
    loading: status === "loading" && balStatus === "loading",
  });

  return (
    <>
      <div className={ready && balance?.value?.gt(constants.Zero) ? "" : "hidden"}>
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
            render={({ balance, price, status }) => (
              <div>
                Erc20.BalanceOfValue:{" "}
                <Contract.Value balance={balance?.value} price={price?.value} status={status} callback={callback} />
              </div>
            )}
          />

          <Escrow.BalanceOf
            key={`Escrow.BalanceOfValue`}
            account={account}
            address={address}
            chainId={chainId}
            render={({ balance, price, status }) => (
              <div>
                Escrow.BalanceOfValue: <Contract.Value balance={balance?.value} price={price?.value} status={status} />
              </div>
            )}
          />

          <Escrow.ClaimableBalanceOf
            key={`Escrow.ClaimableBalanceOfValue`}
            account={account}
            address={address}
            chainId={chainId}
            render={({ balance, price, status }) => (
              <div>
                Escrow.ClaimableBalanceOfValue:{" "}
                <Contract.Value balance={balance?.value} price={price?.value} status={status} />
              </div>
            )}
          />

          <Escrow.VestingBalanceOf
            key={`Escrow.VestingBalanceOfValue`}
            account={account}
            address={address}
            chainId={chainId}
            render={({ balance, price, status }) => (
              <div>
                Escrow.VestingBalanceOfValue:{" "}
                <Contract.Value balance={balance?.value} price={price?.value} status={status} />
              </div>
            )}
          />

          <div>
            Price.PriceOf: <Price.PriceOf key={`Price.PriceOf`} address={address} chainId={chainId} />
          </div>

          <div>
            Staking.vAPR: <Staking.Apy key={`Staking.vAPR`} address={address} chainId={chainId} />
          </div>

          <Staking.ClaimableBalanceOf
            key={`Staking.ClaimableBalanceValue`}
            account={account}
            address={address}
            chainId={chainId}
            render={(props) => (
              <div>
                Staking.ClaimableBalanceValue:{" "}
                <Contract.Value balance={props.balance} price={props.price} decimals={props.decimals} />
              </div>
            )}
          />

          <div>
            Contract.TVL: <Contract.Tvl key={`Contract.TVL`} address={address} chainId={chainId} />
          </div>
        </div>

        <br />
      </div>
    </>
  );
};

export default Metadata;
