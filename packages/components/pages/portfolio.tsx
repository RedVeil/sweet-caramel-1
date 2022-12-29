import type { NextPage } from "next";
import type { Pop } from "@popcorn/components/lib/types";
import { Fragment, useEffect, useMemo, useState } from "react";
import { BigNumber, constants } from "ethers";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";

import { useNamedAccounts } from "@popcorn/components/lib/utils/hooks";
import { useFeatures } from "@popcorn/components/hooks";
import Metadata from "@popcorn/components/lib/Contract/Metadata";

import { useChainsWithStakingRewards } from "../../greenfield-app/hooks/staking/useChainsWithStaking";
import useNetworkFilter from "../../greenfield-app/hooks/useNetworkFilter";
import PortfolioHero from "../components/Portfolio/PortfolioHero";
import { AssetRow } from "../components/PortfolioSection";
import PortfolioClaimableBalance from "../components/PortfolioClaimableBalance";
import { Erc20 } from "../lib";

const PortfolioSection = dynamic(() => import("../components/PortfolioSection"), {
  ssr: false,
});

type BalanceByKey = { [key: string]: { value: BigNumber | undefined; chainId: number } };

export enum SortingType {
  BalDesc,
  BalAsc,
}

function sortBalDesc(a, b, balances: BalanceByKey): 0 | 1 | -1 {
  const aValue = balances[getItemKey(a)]?.value;
  const bValue = balances[getItemKey(b)]?.value;
  if (!bValue) return 0;
  return bValue.gt(aValue || 0) ? 1 : -1;
}

function sortBalAsc(a, b, balances: BalanceByKey): 0 | 1 | -1 {
  const aValue = balances[getItemKey(a)]?.value;
  const bValue = balances[getItemKey(b)]?.value;
  if (!bValue) return 0;
  return bValue.lt(aValue || 0) ? 1 : -1;
}

function sortEntries(a, b, balances: BalanceByKey, sortingType: SortingType): 0 | 1 | -1 {
  switch (sortingType) {
    case SortingType.BalAsc:
      return sortBalAsc(a, b, balances);
    case SortingType.BalDesc:
    default:
      return sortBalDesc(a, b, balances);
  }
}

const getItemKey = (token: Pop.NamedAccountsMetadata) => `${token.chainId}:${token.__alias}:${token.address}`;

const sumUpBalances = (balances = {}, selectedNetworks: Array<any> = []) =>
  Object.keys(balances).reduce((total, key) => {
    const asset = balances[key];
    const value = selectedNetworks.includes(asset.chainId) ? asset.value : 0;
    return total.add(value);
  }, constants.Zero);

// TODO: constants must be in UPPERCASE. Refactor
export const Sections = ["Assets", "Rewards"];
const INIT_BALANCE_STATE = {
  pop: {} as BalanceByKey,
  escrow: {} as BalanceByKey,
};
export const PortfolioPage: NextPage = () => {
  const {
    features: { portfolio: visible },
  } = useFeatures();

  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);

  // const account = "0x6326c9F3934B090b82b2F92C44a1D981913e02CD"; // M
  // const account = "0x22f5413C075Ccd56D575A54763831C4c27A37Bdb" // L
  const { address: account } = useAccount();

  const [balances, setBalances] = useState(INIT_BALANCE_STATE);
  const [selectedSections, selectSections] = useState(Sections);
  const [sortingType, setSortingType] = useState(SortingType.BalDesc);

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

  const filterByChainId = (contracts: Array<any>, chainId) => (selectedNetworks.includes(chainId) ? contracts : []);

  const [rewardContracts, escrowContracts] = useMemo(() => {
    const allContracts = [
      ...filterByChainId(contractsEth, 1),
      ...filterByChainId(contractsPoly, 137),
      ...filterByChainId(contractsBnb, 56),
      ...filterByChainId(contractsArbitrum, 42161),
      ...filterByChainId(contractsOp, 10),
    ].flatMap((network) => network) as Array<Pop.NamedAccountsMetadata>;

    const escrow = allContracts.filter(({ __alias }) => __alias === "rewardsEscrow");
    const rewards = allContracts.filter(({ __alias }) => __alias !== "rewardsEscrow");
    return [rewards, escrow];
    // re-trigger only when array length change to avoid shallow object false positives
  }, [
    account,
    contractsEth.length,
    contractsPoly.length,
    contractsBnb.length,
    contractsArbitrum.length,
    selectedNetworks,
  ]);

  useEffect(() => {
    setBalances(INIT_BALANCE_STATE);
    // reset when new account
  }, [account]);

  const addToBalances = (key, type: "escrow" | "pop", chainId: number, value?: BigNumber) => {
    if (value?.gt(0)) {
      setBalances((balances) => ({
        ...balances,
        [type]: {
          ...balances[type],
          [key]: { value, chainId: chainId },
        },
      }));
    }
  };

  const totalBalance = {
    pop: sumUpBalances(balances.pop, selectedNetworks),
    escrow: sumUpBalances(balances.escrow, selectedNetworks),
  };

  const networth = totalBalance.pop.add(totalBalance.escrow);

  return (
    <Fragment>
      <PortfolioHero
        supportedNetworks={supportedNetworks}
        selectedNetworks={selectedNetworks}
        selectNetwork={selectNetwork}
        balance={totalBalance.pop}
        vestingBalance={totalBalance.escrow}
        account={account}
        tabs={{ available: Sections, active: [selectedSections, selectSections] }}
      />
      <PortfolioSection
        selectedNetworks={selectedNetworks}
        selectedSections={selectedSections}
        networth={networth}
        balance={totalBalance.pop}
        title="Assets"
      >
        {rewardContracts
          .sort((a, b) => sortEntries(a, b, balances.pop, SortingType.BalDesc))
          .map((token) => {
            const key = getItemKey(token);
            const chainId = Number(token.chainId);
            return (
              <Metadata chainId={chainId} address={token.address} alias={token.__alias} key={key}>
                {(metadata) => (
                  <Erc20.BalanceOf
                    chainId={chainId}
                    account={account}
                    address={token.address}
                    render={({ balance, price, status }) => (
                      <AssetRow
                        name={metadata?.name}
                        address={token.address}
                        balance={balance}
                        chainId={chainId}
                        networth={totalBalance.pop}
                        price={price}
                        status={status}
                        callback={(value) => addToBalances(key, "pop", chainId, value)}
                      />
                    )}
                  />
                )}
              </Metadata>
            );
          })}
      </PortfolioSection>
      <PortfolioSection
        selectedNetworks={selectedNetworks}
        selectedSections={selectedSections}
        networth={networth}
        balance={totalBalance.escrow}
        title="Rewards"
      >
        {escrowContracts
          .sort((a, b) => sortEntries(a, b, balances.escrow, SortingType.BalDesc))
          .map((token) => {
            const key = getItemKey(token);
            return (
              <PortfolioClaimableBalance
                key={`rewards-${key}`}
                account={account}
                networth={totalBalance.escrow}
                callback={(value) => addToBalances(key, "escrow", Number(token.chainId), value)}
                token={token}
              />
            );
          })}
      </PortfolioSection>
    </Fragment>
  );
};

export default PortfolioPage;
