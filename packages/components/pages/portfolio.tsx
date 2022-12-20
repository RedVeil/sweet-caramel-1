import { NextPage } from "next";
import dynamic from "next/dynamic";
import { useNamedAccounts } from "@popcorn/components/lib/utils/hooks";
import { ChainId } from "@popcorn/utils";
import { useFeatures } from "@popcorn/components/hooks";
import { Pop } from "@popcorn/components/lib/types";
import { Networth } from "@popcorn/components/lib/Portfolio/Networth";
import { BigNumber, constants } from "ethers";
import useSum from "../hooks/useSum3";
import { useAccount } from "wagmi";
import { parseEther } from "ethers/lib/utils.js";
import { useMemo, useRef, useState } from "react";

const Metadata = dynamic(() => import("@popcorn/components/lib/Contract/Metadata"), {
  ssr: false,
});

const getItemKey = (token: any) => `${token.chainId}:${token.address}`;

export const PortfolioPage: NextPage = () => {
  const {
    features: { portfolio: visible },
  } = useFeatures();

  const [balances, setBalances] = useState({} as { [key: string]: BigNumber | undefined });
  const { address: account } = useAccount();
  // const account = "0x22f5413C075Ccd56D575A54763831C4c27A37Bdb";
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
    //...contractsPoly, ...contractsBnb, ...contractsArbitrum, ...contractsOp
    return [...contractsEth].flatMap((network) => network) as Array<
      Pop.NamedAccountsMetadata & { chainId: string; address: string; __alias: string }
    >;
  }, [account, contractsEth.length]);
  // contractsPoly.length, contractsBnb.length, contractsArbitrum.length
  const addToNetworth = (key, _value?: BigNumber) => {
    if (_value?.gt(0)) {
      console.log({ balances });
      setBalances((current) => ({
        ...current,
        [key]: _value || constants.Zero,
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
