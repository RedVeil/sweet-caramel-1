import { useNamedAccounts } from "../hooks";
import { NextPage } from "next";
import { useAccount } from "wagmi";
import { ChainId } from "@popcorn/utils";
import { useFeatures } from "@popcorn/components/hooks";
import { Escrow, Erc20, Price, Contract, Staking } from "../pop";
import { Pop } from "../pop/types";
import { Networth } from "../pop/Portfolio/Networth";
import { BigNumber } from "ethers";
import useSum from "../hooks/useSum3";

export const PortfolioPage: NextPage = () => {
  const {
    features: { portfolio: visible },
  } = useFeatures();

  const { address: account } = useAccount();
  // const account = "0x32cb9fd13af7635cc90d0713a80188b366a28205";

  const contractsEth = useNamedAccounts("1", [
    "pop",
    "popStaking",
    "threeX",
    "threeXStaking",
    "butter",
    "butterStaking",
    "xenStaking",
    "popUsdcArrakisVaultStaking",
    "rewardsEscrow",
  ]);

  const contractsPoly = useNamedAccounts("137", [
    "pop",
    "popStaking",
    "popUsdcSushiLP",
    "popUsdcArrakisVault",
    "popUsdcArrakisVaultStaking",
    "rewardsEscrow",
    "xPop",
  ]);

  const contractsBnb = useNamedAccounts("56", ["pop", "xPop", "rewardsEscrow"]);

  const contractsArbitrum = useNamedAccounts("42161", ["pop", "xPop", "rewardsEscrow"]);

  const contractsOp = useNamedAccounts("10", ["pop", "popUsdcArrakisVault"]);
  const allContracts = [
    ...contractsEth,
    ...contractsPoly,
    ...contractsBnb,
    ...contractsArbitrum,
    ...contractsOp,
  ].flatMap((network) => network) as Pop.NamedAccountsMetadata[];

  const { loading: networthLoading, sum: networth, add } = useSum({ expected: 1 });
  const addToNetworth = (value?: BigNumber) => {
    !!value && add(value);
    return true;
  };
  return (
    <div className={visible ? "" : "hidden"}>
      <Networth account={account} loading={networthLoading} value={networth} />

      {allContracts.map((token, i) => (
        <Contract.Metadata
          index={i}
          alias={token.__alias}
          key={`${i}:${token.chainId}:${token.address}`}
          chainId={Number(token.chainId) as unknown as ChainId}
          address={token.address}
        >
          <Erc20.BalanceOf key={`Erc20.BalanceOf`} account={account} address={token.address} chainId={token.chainId} />

          <Erc20.BalanceOf
            key={`Erc20.BalanceOfValue`}
            account={account}
            address={token.address}
            chainId={token.chainId}
            render={({ balance, price, status }) => (
              <Contract.Value balance={balance?.value} price={price?.value} status={status} callback={addToNetworth} />
            )}
          />

          <Escrow.BalanceOf
            key={`Escrow.BalanceOf`}
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Escrow.BalanceOf
            key={`Escrow.BalanceOfValue`}
            account={account}
            address={token.address}
            chainId={token.chainId}
            render={({ balance, price, status }) => (
              <>
                <Contract.Value balance={balance?.value} price={price?.value} status={status} />
              </>
            )}
          />

          <Escrow.ClaimableBalanceOf
            key={`Escrow.ClaimableBalanceOf`}
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Escrow.ClaimableBalanceOf
            key={`Escrow.ClaimableBalanceOfValue`}
            account={account}
            address={token.address}
            chainId={token.chainId}
            render={({ balance, price, status }) => (
              <Contract.Value balance={balance?.value} price={price?.value} status={status} />
            )}
          />

          <Escrow.VestingBalanceOf
            key={`Escrow.VestingBalanceOf`}
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Escrow.VestingBalanceOf
            key={`Escrow.VestingBalanceOfValue`}
            account={account}
            address={token.address}
            chainId={token.chainId}
            render={({ balance, price, status }) => (
              <Contract.Value balance={balance?.value} price={price?.value} status={status} />
            )}
          />

          <Price.PriceOf key={`Price.PriceOf`} address={token.address} chainId={token.chainId} />

          <Staking.Apy key={`Staking.vAPR`} address={token.address} chainId={token.chainId} />

          <Staking.ClaimableBalanceOf
            key={`Staking.ClaimableBalanceOf`}
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Staking.ClaimableBalanceOf
            key={`Staking.ClaimableBalanceValue`}
            account={account}
            address={token.address}
            chainId={token.chainId}
            render={(props) => <Contract.Value balance={props.balance} price={props.price} decimals={props.decimals} />}
          />

          <Contract.Tvl key={`Contract.TVL`} address={token.address} chainId={token.chainId} />
        </Contract.Metadata>
      ))}
    </div>
  );
};

export default PortfolioPage;
