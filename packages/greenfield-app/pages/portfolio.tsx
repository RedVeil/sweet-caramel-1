import React, { useState } from "react";
import PortfolioHero from "@popcorn/components/components/Portfolio/PortfolioHero";
import ProductsPortfolio from "@popcorn/components/components/Portfolio/ProductsPortfolio";
import { Tabs } from "@popcorn/components/components/Tabs";
import useNetworkFilter from "hooks/useNetworkFilter";
import { useChainsWithStakingRewards } from "hooks/staking/useChainsWithStaking";
import NetworkFilter from "components/NetworkFilter";
import { RenderBalance } from "@popcorn/components/lib/Contract";
import { useSupportedContracts } from "@popcorn/components";

const tabs = [{ label: "All" }, { label: "Rewards" }, { label: "Assets" }];
const Portfolio = () => {
  const account = "0x4f20cb7a1d567a54350a18dacb0cc803aebb4483";
  const [activeTab, setActiveTab] = useState({ label: "All" });
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);
  const selectedContracts = useSupportedContracts(selectedNetworks);

  return (
    <div>
      {selectedContracts.map((token, index) => (
        <RenderBalance key={index} address={token.address} chainId={token.chainId} account={account} />
      ))}
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
      </div>
    </div>
  );
};

export default Portfolio;
