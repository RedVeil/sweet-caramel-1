import type { Pop } from "@popcorn/components/lib/types";
import React, { useState } from "react";
import { useContractReads } from "wagmi";
import { BigNumber } from "ethers";

import useNetworkFilter from "hooks/useNetworkFilter";
import { useChainsWithStakingRewards } from "hooks/staking/useChainsWithStaking";

import { Tabs } from "@popcorn/components/components/Tabs";
import PortfolioHero from "@popcorn/components/components/Portfolio/PortfolioHero";
import ProductsPortfolio from "@popcorn/components/components/Portfolio/ProductsPortfolio";
import NetworkFilter from "components/NetworkFilter";

const tabs = [{ label: "All" }, { label: "Products" }, { label: "Rewards" }, { label: "Assets" }];
const Portfolio = () => {
  const [activeTab, setActiveTab] = useState({ label: "All" });
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);

  function filterRewardsOnly(renderElement, metadata: Pop.NamedAccountsMetadata) {
    return <RenderIfRewards metadata={metadata as any} element={renderElement} />;
  }

  return (
    <div>
      <div>
        <PortfolioHero
          NetworkSwitcher={
            <NetworkFilter
              supportedNetworks={supportedNetworks}
              selectedNetworks={selectedNetworks}
              selectNetwork={selectNetwork}
            />
          }
          TabButtons={<Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />}
          selectedNetworks={selectedNetworks}
        />
      </div>
      <div className="mt-7">
        <ProductsPortfolio selectedNetworks={selectedNetworks} />
        <ProductsPortfolio filterRenderItems={filterRewardsOnly} title="Rewards" selectedNetworks={selectedNetworks} />
      </div>
    </div>
  );
};

function RenderIfRewards({
  element,
  metadata,
}: {
  element: any;
  metadata: Pop.NamedAccountsMetadata & {
    chainId: any;
    address: string;
  };
}) {
  // const { address: account } = useAccount();
  const account = "0x4f20cb7a1d567a54350a18dacb0cc803aebb4483";
  // TODO: Why is `account` hardcoded (at ProductsPortfolio.tsx) ?

  const { data: claimableRewards } = useContractReads({
    cacheOnBlock: true,
    contracts: [
      {
        address: metadata.address,
        chainId: Number(metadata.chainId),
        abi: ["function getClaimableAmount(bytes32) external view returns (uint256)"],
        functionName: "getClaimableAmount",
        args: [account],
      },
      {
        address: metadata.address,
        chainId: Number(metadata.chainId),
        abi: ["function earned(address) external view returns (uint256)"],
        functionName: "earned(address)",
        args: [account],
      },
    ],
  });

  const userHasClaimableRewards = claimableRewards?.find((reward?: BigNumber) => {
    return reward?.gt(0);
  });

  return userHasClaimableRewards ? element : null;
}

export default Portfolio;
