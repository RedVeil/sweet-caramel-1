import { useState, useEffect } from "react";
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
import { TotalPopBalanceOf, TotalVestingBalanceOf } from "@popcorn/components/lib/Contract";
import { resetNetworth } from "@popcorn/components/reducers/networth";
import { useNetworth } from "@popcorn/components/context/Networth";

const tabs = [{ label: "All" }, { label: "Rewards" }, { label: "Assets" }];

const Portfolio = () => {
  const { address: account } = useAccount();
  const [activeTab, setActiveTab] = useState({ label: "All" });
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useNetworkFilter(supportedNetworks);
  const selectedContracts = useSupportedContracts(selectedNetworks);
  const [selectedFilter, setSelectedFilter] = useState<{ id: string; value: string }>(undefined);
  const { dispatch } = useNetworth();

  useEffect(() => {
    if (!account) {
      resetNetworth()(dispatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  return (
    <div>
      {selectedContracts.map((token, index) => (
        <RenderBalance key={index} address={token.address} chainId={token.chainId} account={account} />
      ))}
      <div>
        <PortfolioHero
          NetworkSwitcher={<NetworkFilter supportedNetworks={supportedNetworks} selectNetwork={selectNetwork} />}
          TabButtons={<Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />}
          selectedNetworks={selectedNetworks}
          account={account}
          filterState={[selectedFilter, setSelectedFilter]}
          VestingBalance={<TotalVestingBalanceOf selectedContracts={selectedContracts} account={account} />}
          POPInWalletBalance={<TotalPopBalanceOf selectedContracts={selectedContracts} account={account} />}
        />
      </div>
      <div className="mt-7">
        <div className={account ? "" : "hidden"}>
          <ProductsPortfolio selectedNetworks={selectedNetworks} filterBy={selectedFilter?.id} />
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
