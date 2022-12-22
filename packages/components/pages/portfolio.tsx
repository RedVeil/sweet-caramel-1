import type { NextPage } from "next";
import { useMemo, useState } from "react";
import { BigNumber, constants } from "ethers";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";

import { useNamedAccounts } from "@popcorn/components/lib/utils/hooks";
import { useFeatures } from "@popcorn/components/hooks";
import { NetworkSticker } from "@popcorn/app/components/NetworkSticker";
import { Pop } from "@popcorn/components/lib/types";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { formatAndRoundBigNumber, networkLogos } from "@popcorn/utils";
import { Badge, BadgeVariant } from "@popcorn/components/components/Badge";

import { useChainsWithStakingRewards } from "../../greenfield-app/hooks/staking/useChainsWithStaking";
import useNetworkFilter from "../../greenfield-app/hooks/useNetworkFilter";
import PortfolioHero from "../components/Portfolio/PortfolioHero.clean";
import NetworkIconList from "../../greenfield-app/components/NetworkIconList";
import { Erc20, Contract, Escrow } from "../lib";

const Metadata = dynamic(() => import("@popcorn/components/lib/Contract/Metadata"), {
  ssr: false,
});

type BalanceByKey = { [key: string]: BigNumber | undefined };

const getItemKey = (token: any) => `${token.chainId}:${token.__alias}`;
const sumUpBalances = (balances = {}) =>
  Object.keys(balances).reduce((total, key) => {
    return total.add(balances[key] || 0);
  }, constants.Zero);

const HUNDRED = BigNumber.from(100);
export const PortfolioPage: NextPage = () => {
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedFilter, setSelectedFilter] = useState<{ id: string; value: string }>();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);

  const { address: account } = useAccount();
  const [balances, setBalances] = useState({
    pop: {} as BalanceByKey,
    escrow: {} as BalanceByKey,
  });
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

  const filterFor = (contracts: Array<any>, chainId) => (selectedNetworks.includes(chainId) ? contracts : []);

  const allContracts = useMemo(() => {
    const filteredContracs = [
      ...filterFor(contractsEth, 1),
      ...filterFor(contractsPoly, 137),
      ...filterFor(contractsBnb, 56),
      ...filterFor(contractsArbitrum, 42161),
      ...filterFor(contractsOp, 10),
    ];
    return filteredContracs.flatMap((network) => network) as Array<
      Pop.NamedAccountsMetadata & { chainId: string; address: string; __alias: string }
    >;
    // re-trigger only when array length change to avoid shallow object false positives
  }, [
    account,
    contractsEth.length,
    contractsPoly.length,
    contractsBnb.length,
    contractsArbitrum.length,
    selectedNetworks,
  ]);

  const escrowContracts = useMemo(() => {
    return allContracts
      .filter((contract) => contract.__alias === "rewardsEscrow")
      .flatMap((network) => network) as Array<
      Pop.NamedAccountsMetadata & { chainId: string; address: string; __alias: string }
    >;
  }, [allContracts]);

  const addToBalances = (key, type: "escrow" | "pop", value?: BigNumber) => {
    if (value?.gt(0)) {
      setBalances((balances) => ({
        ...balances,
        [type]: {
          ...balances[type],
          [key]: value || constants.Zero,
        },
      }));
    }
  };

  const totalBalance = {
    pop: sumUpBalances(balances.pop),
    escrow: sumUpBalances(balances.escrow),
  };

  const networth = totalBalance.pop.add(totalBalance.escrow);

  return (
    <div className={visible ? "" : "hidden"}>
      <PortfolioHero
        supportedNetworks={supportedNetworks}
        selectedNetworks={selectedNetworks}
        filterState={[selectedFilter!, setSelectedFilter]}
        balance={networth}
        selectNetwork={selectNetwork}
        vestingBalance={constants.Zero}
        account={account}
      />

      <PortfolioSection
        selectedNetworks={selectedNetworks}
        title="Assets"
        portfolio={{
          balance: networth,
          totalSupply: totalBalance.pop,
        }}
      >
        {allContracts
          .filter((contract) => contract.__alias !== "rewardsEscrow")
          .sort((a, b) => {
            const aValue = balances.pop[getItemKey(a)];
            const bValue = balances.pop[getItemKey(b)];
            if (!bValue) return 0;
            return bValue.gt(aValue || 0) ? 1 : -1;
          })
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
                          <div
                            className={`${
                              balance?.value?.gt(0) ? "" : "hidden"
                            } md:bg-customLightGray md:bg-opacity-[10%] rounded-2xl py-4 mb-4`}
                          >
                            <div className="grid grid-cols-12">
                              <div className={`flex items-center space-x-4 md:space-x-[52px] md:col-span-6 md:pl-8`}>
                                <div className="relative">
                                  <NetworkSticker selectedChainId={chainId} />
                                  <TokenIcon token={token.address || ""} chainId={chainId} />
                                </div>

                                <div className="flex space-x-[6px] md:space-x-[52px]">
                                  <div>
                                    <p className="font-medium text-xs md:text-lg">{metadata?.name}</p>
                                    <p className="text-tokenTextGray text-[10px] md:text-base">Popcorn</p>
                                  </div>
                                </div>
                              </div>
                              <div className={`md:col-span-6 grid grid-cols-12 ${true ? "col-span-6" : "col-span-7"}`}>
                                <StyledBalance>
                                  <>{formatAndRoundBigNumber(price?.value || constants.Zero, 18) + "$"}</>
                                </StyledBalance>
                                <StyledBalance>
                                  <>
                                    {networth.gt(0) && balances[key]?.gt(0)
                                      ? HUNDRED.mul(balances[key]!).div(networth).toString()
                                      : constants.Zero.toString()}{" "}
                                    %
                                  </>
                                </StyledBalance>
                                <div className="col-end-13 col-span-6 md:col-span-4">
                                  <StyledBalance>
                                    <Contract.Value
                                      status={status}
                                      balance={balance?.value}
                                      price={price?.value}
                                      callback={(value) => addToBalances(key, "pop", value)}
                                    />
                                  </StyledBalance>
                                  <p className="text-tokenTextGray text-[10px] md:text-base">
                                    {balance?.formatted} {metadata?.symbol}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
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
        title="Rewards"
        portfolio={{
          balance: networth,
          totalSupply: totalBalance.escrow,
        }}
      >
        {escrowContracts
          .sort((a, b) => {
            const aValue = balances.escrow[getItemKey(a)];
            const bValue = balances.escrow[getItemKey(b)];
            if (!bValue) return 0;
            return bValue.gt(aValue || 0) ? 1 : -1;
          })
          .map((token) => {
            const key = getItemKey(token);
            return (
              <div key={key}>
                <Escrow.ClaimableBalanceOf
                  account={account}
                  address={token.address}
                  chainId={Number(token.chainId)}
                  render={({ balance, price, status }) => (
                    <div
                      className={`${
                        balance?.value?.gt(0) ? "" : "hidden"
                      } md:bg-customLightGray md:bg-opacity-[10%] rounded-2xl py-4 mb-4`}
                    >
                      <div className="grid grid-cols-12">
                        <div className={`flex items-center space-x-4 md:space-x-[52px] md:col-span-6 md:pl-8`}>
                          <div className="relative">
                            <NetworkSticker selectedChainId={Number(token.chainId)} />
                            <TokenIcon token={token.address || ""} chainId={Number(token.chainId)} />
                          </div>

                          <div className="flex space-x-[6px] md:space-x-[52px]">
                            <div>
                              <p className="font-medium text-xs md:text-lg">Pop</p>
                              <p className="text-tokenTextGray text-[10px] md:text-base">Popcorn</p>
                            </div>
                          </div>
                          <Badge variant={BadgeVariant.primary}>Claimable</Badge>
                        </div>
                        <div className={`md:col-span-6 grid grid-cols-12 ${true ? "col-span-6" : "col-span-7"}`}>
                          <StyledBalance>
                            <>{formatAndRoundBigNumber(price?.value || constants.Zero, 18) + "$"}</>
                          </StyledBalance>
                          <StyledBalance>
                            <>
                              {networth.gt(0) && balances[key]?.gt(0)
                                ? HUNDRED.mul(balances[key]!).div(networth).toString()
                                : constants.Zero.toString()}{" "}
                              %
                            </>
                          </StyledBalance>
                          <div className="col-end-13 col-span-6 md:col-span-4">
                            <StyledBalance>
                              <Contract.Value
                                status={status}
                                balance={balance?.value}
                                price={price?.value}
                                callback={(value) => addToBalances(key, "escrow", value)}
                              />
                            </StyledBalance>
                            <p className="text-tokenTextGray text-[10px] md:text-base">{balance?.formatted} Pop</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
                <Escrow.VestingBalanceOf
                  account={account}
                  address={token.address}
                  chainId={Number(token.chainId)}
                  render={({ balance, price, status }) => (
                    <div
                      className={`${
                        balance?.value?.gt(0) ? "" : "hidden"
                      } md:bg-customLightGray md:bg-opacity-[10%] rounded-2xl py-4 mb-4`}
                    >
                      <div className="grid grid-cols-12">
                        <div className={`flex items-center space-x-4 md:space-x-[52px] md:col-span-6 md:pl-8`}>
                          <div className="relative">
                            <NetworkSticker selectedChainId={Number(token.chainId)} />
                            <TokenIcon token={token.address || ""} chainId={Number(token.chainId)} />
                          </div>
                          <div className="flex space-x-[6px] md:space-x-[52px]">
                            <div>
                              <p className="font-medium text-xs md:text-lg">Pop</p>
                              <p className="text-tokenTextGray text-[10px] md:text-base">Popcorn</p>
                            </div>
                          </div>
                          <Badge variant={BadgeVariant.dark}>
                            <>Vesting</>
                          </Badge>
                        </div>
                        <div className={`md:col-span-6 grid grid-cols-12 ${true ? "col-span-6" : "col-span-7"}`}>
                          <StyledBalance>
                            <>{formatAndRoundBigNumber(price?.value || constants.Zero, 18) + "$"}</>
                          </StyledBalance>
                          <StyledBalance>
                            <>
                              {networth.gt(0) && balances[key]?.gt(0)
                                ? HUNDRED.mul(balances[key]!).div(networth).toString()
                                : constants.Zero.toString()}{" "}
                              %
                            </>
                          </StyledBalance>
                          <div className="col-end-13 col-span-6 md:col-span-4">
                            <StyledBalance>
                              <Contract.Value
                                status={status}
                                balance={balance?.value}
                                price={price?.value}
                                callback={(value) => addToBalances(key, "escrow", value)}
                              />
                            </StyledBalance>
                            <p className="text-tokenTextGray text-[10px] md:text-base">{balance?.formatted} Pop</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            );
          })}
      </PortfolioSection>
    </div>
  );
};

function StyledBalance({ children }) {
  return (
    <div className={`text-primary text-xs md:text-lg font-medium col-end-13 col-span-6 md:col-span-4`}>{children}</div>
  );
}

function PortfolioSection({
  selectedNetworks,
  children,
  portfolio,
  title,
}: {
  selectedNetworks: any;
  children: any;
  portfolio: {
    balance: BigNumber;
    totalSupply: BigNumber;
  };
  title: string;
}) {
  const { balance, totalSupply } = portfolio;
  const balanceGTZero = balance?.gt(0);
  const portfolioDistribution =
    balanceGTZero && totalSupply?.gt(0) ? HUNDRED.mul(balance).div(totalSupply).toString() : constants.Zero.toString();
  return (
    <div className={balanceGTZero ? "" : "hidden"}>
      <section className="grid mt-16 grid-cols-12 pb-4 md:pb-0 border-b-[0.5px] md:border-b-0 border-customLightGray">
        <div className="col-span-12 md:col-span-6 flex items-center space-x-5 mb-6 md:mb-[48px]">
          <h2 className="text-2xl md:text-3xl leading-6 md:leading-8">{title}</h2>
          <NetworkIconList networks={selectedNetworks} />
        </div>
        <div className="col-span-12 md:col-span-6 grid grid-cols-12">
          <div className="col-span-12 xs:col-span-7 xs:col-end-13 md:col-span-12 grid grid-cols-12">
            <div className={`text-primary text-lg font-medium col-span-6 md:col-span-4 hidden md:block`}>
              <div className="flex items-center space-x-2">
                <p className="text-primaryLight text-sm md:text-base">Price</p>
                <InfoIconWithTooltip
                  classExtras=""
                  id="price-products-tooltip"
                  title="Total value locked (TVL)"
                  content="Total value locked (TVL) is the amount of user funds deposited in popcorn products."
                />
              </div>
              <div className="text-sm md:text-lg"></div>
            </div>
            <div className={`text-primary text-lg font-medium col-span-6 md:col-span-4 hidden md:block`}>
              <div className="flex items-center space-x-2">
                <p className="text-primaryLight text-sm md:text-base">Portfolio %</p>
                <InfoIconWithTooltip
                  classExtras=""
                  id="portfolio-products-tooltip"
                  title="Total value locked (TVL)"
                  content="Total value locked (TVL) is the amount of user funds deposited in popcorn products."
                />
              </div>
              <div className="text-sm md:text-lg">{portfolioDistribution} %</div>
            </div>
            <div className={`text-primary text-lg font-medium col-span-6 md:col-span-4 hidden md:block`}>
              <div className="flex items-center space-x-2">
                <p className="text-primaryLight text-sm md:text-base">Balance</p>
                <InfoIconWithTooltip
                  classExtras=""
                  id="portfolio-products-tooltip"
                  title="Total value locked (TVL)"
                  content="Total value locked (TVL) is the amount of user funds deposited in popcorn products."
                />
              </div>
              <div className="text-sm md:text-lg">${formatAndRoundBigNumber(portfolio.balance, 18)}</div>
            </div>
          </div>
        </div>
      </section>
      {children}
    </div>
  );
}

export default PortfolioPage;
