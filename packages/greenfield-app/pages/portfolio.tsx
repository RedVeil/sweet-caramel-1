import type { NextPage } from "next";
import type { Pop } from "@popcorn/components/lib/types";
import { SortingType } from "@popcorn/components/components/types";
import { Fragment, useEffect, useMemo, useState } from "react";
import { BigNumber, constants } from "ethers";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";

import { useNamedAccounts } from "@popcorn/components/lib/utils/hooks";
import { useFeatures } from "@popcorn/components/hooks";
import Metadata from "@popcorn/components/lib/Contract/Metadata";

import { useChainsWithStakingRewards } from "../hooks/staking/useChainsWithStaking";
import useNetworkFilter from "../hooks/useNetworkFilter";
import { AssetRow } from "@popcorn/components/components/Portfolio/PortfolioSection";
import PortfolioClaimableBalance from "@popcorn/components/components/Portfolio/PortfolioClaimableBalance";
import { Erc20 } from "@popcorn/components/lib";
import PortfolioHero from "@popcorn/components/components/Portfolio/PortfolioHero";

const PortfolioSection = dynamic(() => import("@popcorn/components/components/Portfolio/PortfolioSection"), {
  ssr: false,
});

type BalanceByKey = { [key: string]: { value: BigNumber | undefined; chainId: number } };

function sortBalDesc(a, b, balances: BalanceByKey): 0 | 1 | -1 {
  const aValue = balances[getItemKey(a)]?.value;
  const bValue = balances[getItemKey(b)]?.value;
  return bValue?.gt(aValue || 0) ? 1 : -1;
}

function sortBalAsc(a, b, balances: BalanceByKey): 0 | 1 | -1 {
  const aValue = balances[getItemKey(a)]?.value;
  const bValue = balances[getItemKey(b)]?.value;
  return bValue?.lt(aValue || 0) ? 1 : -1;
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
export const Sections = ["Assets", "Claimable", "Vesting"];
const INIT_BALANCE_STATE = {
  pop: {} as BalanceByKey,
  claimable: {} as BalanceByKey,
  vesting: {} as BalanceByKey,
};

export const PortfolioPage: NextPage = () => {
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);

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

  const addToBalances = (key, type: "claimable" | "pop" | "vesting", chainId: number, value?: BigNumber) => {
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
    vesting: sumUpBalances(balances.vesting, selectedNetworks),
    claimable: sumUpBalances(balances.claimable, selectedNetworks),
  };

  const rewardsBalance = totalBalance.claimable.add(totalBalance.vesting);
  const networth = totalBalance.pop.add(rewardsBalance);

  return (
    <Fragment>
      <PortfolioHero
        supportedNetworks={supportedNetworks}
        selectedNetworks={selectedNetworks}
        selectNetwork={selectNetwork}
        networth={networth}
        vestingBalance={rewardsBalance}
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
                        token={token}
                        balance={balance}
                        chainId={chainId}
                        networth={networth}
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
        balance={totalBalance.claimable}
        sectionKeyName={"Claimable"}
        title="Claimable"
      >
        {escrowContracts
          .sort((a, b) => sortEntries(a, b, balances.claimable, SortingType.BalDesc))
          .map((token) => {
            const key = getItemKey(token);
            return (
              <PortfolioClaimableBalance
                key={`rewards-${key}`}
                account={account}
                type="claimable"
                networth={networth}
                callback={(value) => addToBalances(key, "claimable", Number(token.chainId), value)}
                token={token}
              />
            );
          })}
      </PortfolioSection>

      <PortfolioSection
        selectedNetworks={selectedNetworks}
        selectedSections={selectedSections}
        networth={networth}
        balance={totalBalance.vesting}
        sectionKeyName={"Vesting"}
        title="Vesting"
      >
        {escrowContracts
          .sort((a, b) => sortEntries(a, b, balances.vesting, SortingType.BalDesc))
          .map((token) => {
            const key = getItemKey(token);
            return (
              <PortfolioClaimableBalance
                key={`vesting-${key}`}
                account={account}
                type="vesting"
                networth={networth}
                callback={(value) => addToBalances(key, "vesting", Number(token.chainId), value)}
                token={token}
              />
            );
          })}
      </PortfolioSection>
    </Fragment>
  );
};

export default PortfolioPage;
