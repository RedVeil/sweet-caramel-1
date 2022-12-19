import { useNamedAccounts } from "@popcorn/components/lib/utils/hooks";
import { NextPage } from "next";
import { ChainId } from "@popcorn/utils";
import { useFeatures } from "@popcorn/components/hooks";
import { Escrow, Erc20, Price, Contract, Staking } from "@popcorn/components/lib";
import { Pop } from "@popcorn/components/lib/types";
import { Networth } from "@popcorn/components/lib/Portfolio/Networth";
import { BigNumber, constants } from "ethers";
import useSum from "../hooks/useSum3";
import { useAccount } from "wagmi";
import { parseEther } from "ethers/lib/utils.js";

export const PortfolioPage: NextPage = () => {
  const {
    features: { portfolio: visible },
  } = useFeatures();

  const { address: account } = useAccount();

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
          callback={addToNetworth}
        />
      ))}
    </div>
  );
};

export default PortfolioPage;
