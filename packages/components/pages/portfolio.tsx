import type { NextPage } from "next";
import { useMemo, useState } from "react";
import { BigNumber, constants } from "ethers";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";

import { Networth } from "@popcorn/components/lib/Portfolio/Networth";
import { useNamedAccounts } from "@popcorn/components/lib/utils/hooks";
import { useFeatures } from "@popcorn/components/hooks";
import { Pop } from "@popcorn/components/lib/types";

const Metadata = dynamic(() => import("@popcorn/components/lib/Contract/Metadata"), {
  ssr: false,
});

const getItemKey = (token: any) => `${token.chainId}:${token.address}`;

export const PortfolioPage: NextPage = () => {
  const { address: account } = useAccount();
  const [balances, setBalances] = useState({} as { [key: string]: BigNumber | undefined });
  const {
    features: { portfolio: visible },
  } = useFeatures();

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

  const allContracts = useMemo(() => {
    return [...contractsEth, ...contractsPoly, ...contractsBnb, ...contractsArbitrum, ...contractsOp].flatMap(
      (network) => network,
    ) as Array<Pop.NamedAccountsMetadata & { chainId: string; address: string; __alias: string }>;
    // re-trigger only when array length change to avoid shallow object false positives
  }, [account, contractsEth.length, contractsPoly.length, contractsBnb.length, contractsArbitrum.length]);

  const addToNetworth = (key, value?: BigNumber) => {
    if (value?.gt(0)) {
      setBalances((current) => ({
        ...current,
        [key]: value || constants.Zero,
      }));
    }
  };

  const networth = Object.keys(balances).reduce((total, nodeKey) => {
    return total.add(balances[nodeKey] || 0);
  }, constants.Zero);

  return (
    <div className={visible ? "" : "hidden"}>
      <Networth account={account} value={networth} />
      {allContracts
        .sort((a, b) => {
          const aValue = balances[getItemKey(a)];
          const bValue = balances[getItemKey(b)];
          if (!bValue) return 0;
          return bValue.gt(aValue || 0) ? 1 : -1;
        })
        .map((token, i) => {
          const key = getItemKey(token);
          return (
            <Metadata
              index={i}
              alias={token.__alias}
              key={key}
              networth={networth}
              chainId={Number(token.chainId)}
              address={token.address}
              callback={(value) => addToNetworth(key, value)}
            />
          );
        })}
    </div>
  );
};

export default PortfolioPage;
