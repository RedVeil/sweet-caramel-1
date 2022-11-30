import { useNamedAccounts } from "../hooks";
import { NextPage } from "next";
import { useAccount } from "wagmi";
import { ChainId } from "@popcorn/utils";
import { useFeatures } from "@popcorn/components/hooks";
import { Escrow, Erc20, Price, Contract, Staking } from "../pop";
import { Pop } from "../pop/types";
import { Networth } from "../pop/Portfolio/Networth";

export const PortfolioPage: NextPage = () => {
  const {
    features: { portfolio: visible },
  } = useFeatures();

  const { address: account } = useAccount();
  //const account = "0x28dc239fbf64abebc847d889d68c3f1dd18f72a8";

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

  const contractsBnb = useNamedAccounts("56", ["pop", "rewardsEscrow"]);

  const contractsArbitrum = useNamedAccounts("42161", ["pop", "rewardsEscrow"]);

  const contractsOp = useNamedAccounts("10", ["pop", "popUsdcArrakisVault"]);
  const allContracts = [
    ...contractsEth,
    ...contractsPoly,
    ...contractsBnb,
    ...contractsArbitrum,
    ...contractsOp,
  ].flatMap((network) => network) as Pop.NamedAccountsMetadata[];

  return (
    <div className={visible ? "" : "hidden"}>
      <Networth
        account={account}
        allContracts={allContracts.flatMap((network, index) => allContracts[index].address)}
        expected={allContracts.length}
      />

      {allContracts.map((token, i) => (
        <Contract.Metadata
          index={i}
          alias={token.__alias}
          key={`${i}:${token.chainId}:${token.address}`}
          chainId={Number(token.chainId) as unknown as ChainId}
          address={token.address}
        >
          <Erc20.BalanceOf key={`Erc20.BalanceOf`} account={account} address={token.address} chainId={token.chainId} />

          <Erc20.ValueOfBalance
            key={`Erc20.ValueOfBalance`}
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Escrow.BalanceOf
            key={`Escrow.BalanceOf`}
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Escrow.ValueOfBalance
            key={`Escrow.ValueOfBalance`}
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Price.PriceOf key={`Price.PriceOf`}
            address={token.address}
            chainId={token.chainId}
          />

          <Staking.Apy key={`vAPR`}
            address={token.address}
            chainId={token.chainId}
          />

          <Contract.Tvl key={`TVL`}
            address={token.address}
            chainId={token.chainId}
          />
        </Contract.Metadata>
      ))}
    </div>
  );
};

export default PortfolioPage;
