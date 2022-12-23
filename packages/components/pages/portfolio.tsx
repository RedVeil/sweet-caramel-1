import type { NextPage } from "next";
import type { Pop } from "@popcorn/components/lib/types";
import { Fragment, useMemo, useState } from "react";
import { BigNumber, constants } from "ethers";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";

import { useNamedAccounts } from "@popcorn/components/lib/utils/hooks";
import { useFeatures } from "@popcorn/components/hooks";
import { NetworkSticker } from "@popcorn/app/components/NetworkSticker";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { Badge, BadgeVariant } from "@popcorn/components/components/Badge";

import { useChainsWithStakingRewards } from "../../greenfield-app/hooks/staking/useChainsWithStaking";
import useNetworkFilter from "../../greenfield-app/hooks/useNetworkFilter";
import NetworkIconList from "../../greenfield-app/components/NetworkIconList";
import { Erc20, Contract, Escrow } from "../lib";
import PortfolioHero from "../components/Portfolio/PortfolioHero";
import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";

const Metadata = dynamic(() => import("@popcorn/components/lib/Contract/Metadata"), {
  ssr: false,
});

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

type BalanceByKey = { [key: string]: { value: BigNumber | undefined; chainId: number } };

const getItemKey = (token: any) => `${token.chainId}:${token.__alias}`;

const sumUpBalances = (balances = {}, selectedNetworks) =>
  Object.keys(balances).reduce((total, key) => {
    const value = selectedNetworks.includes(balances[key].chainId) ? balances[key].value : 0;
    return total.add(value);
  }, constants.Zero);

const HUNDRED = BigNumber.from(100);

export const Sections = ["Assets", "Rewards"];

export const PortfolioPage: NextPage = () => {
  const {
    features: { portfolio: visible },
  } = useFeatures();

  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);

  const { address: account } = useAccount();
  const [balances, setBalances] = useState({
    pop: {} as BalanceByKey,
    escrow: {} as BalanceByKey,
  });
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
    const rewards = allContracts.filter(({ __alias }) => __alias === "rewardsEscrow");
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

  const addToBalances = (key, type: "escrow" | "pop", chainId: number, value?: BigNumber) => {
    if (value?.gt(0)) {
      setBalances((balances) => ({
        ...balances,
        [type]: {
          ...balances[type],
          [key]: { value: value || constants.Zero, chainId: chainId },
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
    <div className={visible ? "" : "hidden"}>
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
        title="Assets"
        portfolio={{
          balance: totalBalance.pop,
          networth: networth,
        }}
      >
        {rewardContracts
          .sort((a, b) => sortEntries(a, b, balances.pop, SortingType.BalDesc))
          .map((token) => {
            const key = getItemKey(token);
            const chainId = Number(token.chainId);
            return (
              <Metadata chainId={chainId} address={token.address} alias={token.__alias} key={key}>
                {(metadata) => {
                  return (
                    <>
                      <Erc20.BalanceOf
                        chainId={chainId}
                        account={account}
                        address={token.address}
                        render={({ balance, price, status }) => (
                          <AssetRow name={metadata?.name} address={token.address} balance={balance} chainId={chainId}>
                            <AssetCell className="hidden lg:table-cell">
                              {formatAndRoundBigNumber(price?.value || constants.Zero, 18) + "$"}
                            </AssetCell>
                            <AssetCell>
                              {networth.gt(0) && balances[key]?.gt(0)
                                ? HUNDRED.mul(balances[key]!).div(networth).toString()
                                : constants.Zero.toString()}{" "}
                              %
                            </AssetCell>
                            <AssetCell>
                              <Contract.Value
                                status={status}
                                balance={balance?.value}
                                price={price?.value}
                                callback={(value) => addToBalances(key, "pop", chainId, value)}
                              />
                              <p className="text-tokenTextGray text-[10px] md:text-base">
                                {balance?.formatted} {metadata?.symbol}
                              </p>
                            </AssetCell>
                          </AssetRow>
                        )}
                      />
                    </>
                  );
                }}
              </Metadata>
            );
          })}
      </PortfolioSection>

      <PortfolioSection
        selectedNetworks={selectedNetworks}
        selectedSections={selectedSections}
        title="Rewards"
        portfolio={{
          balance: totalBalance.escrow,
          networth: networth,
        }}
      >
        {escrowContracts
          .sort((a, b) => sortEntries(a, b, balances.pop, SortingType.BalDesc))
          .map((token) => {
            const key = getItemKey(token);
            const chainId = Number(token.chainId);
            return (
              <Fragment key={key}>
                <Escrow.ClaimableBalanceOf
                  account={account}
                  address={token.address}
                  chainId={chainId}
                  render={({ balance, price, status }) => (
                    <AssetRow name="Popcorn" chainId={chainId} balance={balance} address={token.address}>
                      <AssetCell>{formatAndRoundBigNumber(price?.value || constants.Zero, 18) + "$"}</AssetCell>
                      <AssetCell>
                        {networth.gt(0) && balances[key]?.gt(0)
                          ? HUNDRED.mul(balances[key]!).div(networth).toString()
                          : constants.Zero.toString()}{" "}
                        %
                      </AssetCell>
                      <AssetCell>
                        <Contract.Value
                          status={status}
                          balance={balance?.value}
                          price={price?.value}
                          callback={(value) => addToBalances(key, "escrow", chainId, value)}
                        />
                        <p className="text-tokenTextGray text-[10px] md:text-base">{balance?.formatted} Pop</p>
                      </AssetCell>
                    </AssetRow>
                  )}
                />
                <Escrow.VestingBalanceOf
                  account={account}
                  address={token.address}
                  chainId={chainId}
                  render={({ balance, price, status }) => (
                    <AssetRow
                      badge={<Badge variant={BadgeVariant.dark}>Vesting</Badge>}
                      balance={balance}
                      name="Popcorn"
                      address={token.address}
                      chainId={chainId}
                    >
                      <AssetCell>{formatAndRoundBigNumber(price?.value || constants.Zero, 18) + "$"}</AssetCell>
                      <AssetCell>
                        {networth.gt(0) && balances[key]?.gt(0)
                          ? HUNDRED.mul(balances[key]!).div(networth).toString()
                          : constants.Zero.toString()}{" "}
                        %
                      </AssetCell>
                      <AssetCell>
                        <Contract.Value
                          status={status}
                          balance={balance?.value}
                          price={price?.value}
                          callback={(value) => addToBalances(key, "escrow", chainId, value)}
                        />
                        <p className="text-tokenTextGray text-[10px] md:text-base">{balance?.formatted} Pop</p>
                      </AssetCell>
                    </AssetRow>
                  )}
                />
              </Fragment>
            );
          })}
      </PortfolioSection>
    </div>
  );
};

function AssetCell({ children, as: Wrapper = "td", className }: { children: any; as?: any; className?: string }) {
  return (
    <Wrapper className={`text-primary text-xs md:text-lg font-medium col-end-13 col-span-6 md:col-span-4 ${className}`}>
      {children}
    </Wrapper>
  );
}

function PortfolioSection({
  selectedNetworks,
  selectedSections,
  children,
  portfolio,
  title,
}: {
  selectedNetworks: any;
  selectedSections: string[];
  children: any;
  portfolio: {
    balance: BigNumber;
    networth: BigNumber;
  };
  title: string;
}) {
  const { balance, networth } = portfolio;
  const balanceGTZero = balance?.gt(0);

  const showSection = selectedSections.includes(title);
  const portfolioDistribution =
    balanceGTZero && balance?.gt(0) ? HUNDRED.mul(balance).div(networth).toString() : constants.Zero.toString();
  return (
    <section className={showSection ? "" : "hidden"}>
      <table className={balanceGTZero ? "w-full" : "w-full"}>
        <thead>
          <tr className="pb-4 border-b border-customLightGray">
            <th className="w-[36rem]">
              <div className="flex items-center space-x-5">
                <h2 className="text-2xl md:text-3xl leading-6 md:leading-8 font-normal">{title}</h2>
                <NetworkIconList networks={selectedNetworks} />
              </div>
            </th>
            <th className="hidden lg:table-cell text-primary text-lg font-medium">
              <div className="flex items-center gap-2">
                <p className="text-primaryLight text-sm md:text-base">Price</p>
                <InfoIconWithTooltip
                  classExtras=""
                  id="portfolio-price-tooltip"
                  title="Price"
                  content="The price of one token in USD."
                />
              </div>
              <div className="text-left text-sm md:text-lg">$12.3</div>
            </th>
            <th className="text-primary text-lg font-medium">
              <div className="flex items-center gap-2">
                <p className="text-primaryLight text-sm md:text-base">Portfolio %</p>
                <InfoIconWithTooltip
                  classExtras=""
                  id="portfolio-percentage-tooltip"
                  title="Portfolio %"
                  content="The size of your position in comparison to your total portfolio in Popcorn."
                />
              </div>
              <div className="text-left text-sm md:text-lg">{portfolioDistribution} %</div>
            </th>
            <th className="text-primary text-lg font-medium">
              <div className="flex items-center space-x-2">
                <p className="text-primaryLight text-sm md:text-base">Balance</p>
                <InfoIconWithTooltip
                  classExtras=""
                  id="portfolio-balance-tooltip"
                  title="Balance"
                  content="The value of your position in USD and in the amount of token."
                />
              </div>
              <div className="text-left text-sm md:text-lg">${formatAndRoundBigNumber(portfolio.balance, 18)}</div>
            </th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      <div className={balanceGTZero ? "hidden" : ""}>
        <NotAvailable title={`No ${title} available`} body={""} image="/images/emptyRecord.svg" />
      </div>
    </section>
  );
}

function AssetRow({
  chainId,
  badge,
  address,
  balance,
  children,
  name,
}: Partial<{
  chainId;
  badge;
  address;
  balance;
  children;
  name;
}>) {
  return (
    <tr
      className={`${
        balance?.value?.gt(0) ? "" : "hidden"
      } md:bg-customLightGray md:bg-opacity-[10%] rounded-2xl py-4 mb-4`}
    >
      <td>
        <div className="flex items-center gap-4">
          <div className="relative">
            <NetworkSticker selectedChainId={chainId} />
            <TokenIcon token={address || ""} chainId={chainId} />
            {badge}
          </div>

          <div className="flex space-x-[6px] md:space-x-[52px]">
            <div>
              <p className="font-medium text-xs md:text-lg">{name}</p>
              <p className="text-tokenTextGray text-[10px] md:text-base">Popcorn</p>
            </div>
          </div>
        </div>
      </td>
      {children}
    </tr>
  );
}

export default PortfolioPage;
