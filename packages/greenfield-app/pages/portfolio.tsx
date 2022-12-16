import React, { useState } from "react";
import PortfolioHero from "@popcorn/components/components/Portfolio/PortfolioHero";
import ProductsPortfolio from "@popcorn/components/components/Portfolio/ProductsPortfolio";
import { Tabs } from "@popcorn/components/components/Tabs";
import useNetworkFilter from "hooks/useNetworkFilter";
import { useChainsWithStakingRewards } from "hooks/staking/useChainsWithStaking";
import NetworkFilter from "components/NetworkFilter";
import { RenderBalance } from "@popcorn/components/lib/Contract";
import { useSupportedContracts } from "@popcorn/components";
import { useAccount } from "wagmi";
import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";

const tabs = [{ label: "All" }, { label: "Rewards" }, { label: "Assets" }];
const Portfolio = () => {
  const { address: account } = useAccount();
  const [activeTab, setActiveTab] = useState({ label: "All" });
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);
  const selectedContracts = useSupportedContracts(selectedNetworks);
  const [selectedfilter, setSelectedFilter] = useState<{ id: string; value: string }>(undefined);

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
          account={account}
          filterState={[selectedfilter, setSelectedFilter]}
        />
      </div>
      <div className="mt-7">
        <div className={account ? "" : "hidden"}>
          <ProductsPortfolio selectedNetworks={selectedNetworks} filterBy={selectedfilter?.id} />
        </div>
        <div className={account ? "hidden" : ""}>
          <NotAvailable
            title="No Records Available"
            body="Connect your wallet to see your portfolio information"
            image="/images/emptyRecord.svg"
          />
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
