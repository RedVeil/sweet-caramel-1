import React, { useState } from "react";

import useNetworkFilter from "hooks/useNetworkFilter";
import { useChainsWithStakingRewards } from "hooks/staking/useChainsWithStaking";
import { useSupportedContracts } from "@popcorn/components";
import { useAccount } from "wagmi";
import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";

import { Tabs } from "@popcorn/components/components/Tabs";
import { RenderBalance } from "@popcorn/components/lib/Contract/RenderBalance";
import PortfolioHero from "@popcorn/components/components/Portfolio/PortfolioHero";
import ProductsPortfolio from "@popcorn/components/components/Portfolio/ProductsPortfolio";
import PortfolioRewards from "@popcorn/components/components/Portfolio/PortfolioRewards";
import NetworkFilter from "components/NetworkFilter";

const tabs = [{ label: "All" }, { label: "Rewards" }, { label: "Assets" }];
const Portfolio = () => {
  // const account = "0x4f20cb7a1d567a54350a18dacb0cc803aebb4483";
  const { address: account } = useAccount();
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
          account={account}
        />
      </div>
      <div className="mt-7">
        <div className={account ? "" : "hidden"}>
          <ProductsPortfolio selectedNetworks={selectedNetworks} />
          <PortfolioRewards selectedNetworks={selectedNetworks} />
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
