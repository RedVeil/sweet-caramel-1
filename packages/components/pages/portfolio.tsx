import type { NextPage } from "next";
import { Fragment, useMemo, useState } from "react";
import { BigNumber, constants } from "ethers";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";

import { useNamedAccounts } from "@popcorn/components/lib/utils/hooks";
import PortfolioSection from "@popcorn/components/components/Portfolio/PortfolioSection.clean";
import { useFeatures } from "@popcorn/components/hooks";
import { Pop } from "@popcorn/components/lib/types";
import PortfolioHero from "../components/Portfolio/PortfolioHero.clean";
import { useChainsWithStakingRewards } from "../../greenfield-app/hooks/staking/useChainsWithStaking";
import useNetworkFilter from "../../greenfield-app/hooks/useNetworkFilter";
import { EmptyStateContainer } from "../../greenfield-app/pages/portfolio";
import { useContractMetadata } from "../lib/Contract";
import { Erc20 } from "../lib";

const Metadata = dynamic(() => import("@popcorn/components/lib/Contract/Metadata"), {
  ssr: false,
});

const getItemKey = (token: any) => `${token.chainId}:${token.address}`;

export const PortfolioPage: NextPage = () => {
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedFilter, setSelectedFilter] = useState<{ id: string; value: string }>();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);

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
      <PortfolioHero
        supportedNetworks={supportedNetworks}
        selectedNetworks={selectedNetworks}
        filterState={[selectedFilter!, setSelectedFilter]}
        balance={networth}
        selectNetwork={selectNetwork}
        vestingBalance={constants.Zero}
        account={account}
      />
      <EmptyStateContainer showEmptyState={!!account}>
        {allContracts
          .sort((a, b) => {
            const aValue = balances[getItemKey(a)];
            const bValue = balances[getItemKey(b)];
            if (!bValue) return 0;
            return bValue.gt(aValue || 0) ? 1 : -1;
          })
          .map((token, i) => {
            const key = getItemKey(token);
            const chainId = Number(token.chainId);
            return (
              <Metadata chainId={chainId} address={token.address} alias={token.__alias} key={key}>
                {(metadata) => {
                  return (
                    <Fragment>
                      <Erc20.ValueOfBalance
                        chainId={chainId}
                        account={account}
                        address={token.address}
                        render={({ balanceUSD }) => {
                          if (balanceUSD?.value?.gt(0)) {
                            return <StyledBalance>{balanceUSD?.value.toString()}</StyledBalance>;
                          }
                          return <></>;
                        }}
                      />
                    </Fragment>
                  );
                }}
              </Metadata>
            );
          })}
      </EmptyStateContainer>
    </div>
  );
};

function StyledBalance({ children }) {
  return (
    <div className={`text-primary text-xs md:text-lg font-medium  col-end-13 col-span-6 md:col-span-4`}>{children}</div>
  );
}

export default PortfolioPage;
