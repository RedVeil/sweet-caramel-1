import React, { useState } from "react";
import PortfolioHero from "@popcorn/components/components/PortfolioHero";
import ProductsPortfolio from "@popcorn/components/components/Portfolio/ProductsPortfolio";
import { Tabs } from "@popcorn/components/components/Tabs";
import useNetworkFilter from "hooks/useNetworkFilter";
import { useChainsWithStaking, useChainsWithStakingRewards } from "hooks/staking/useChainsWithStaking";
import NetworkFilter from "components/NetworkFilter";

const tabs = [{ label: "All" }, { label: "Products" }, { label: "Rewards" }, { label: "Assets" }];
const Portfolio = () => {
  const [activeTab, setActiveTab] = useState({ label: "All" });
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);
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
        />
      </div>
      <div className="mt-7">
        <ProductsPortfolio selectedNetworks={selectedNetworks} />
      </div>
    </div>
  );
};

export default Portfolio;
