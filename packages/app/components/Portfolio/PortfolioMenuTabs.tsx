import CustomDropdown from "components/Common/CustomDropdown";
import { usePortfolio } from "context/PortfolioContext";
import useAvailableNetworks from "hooks/useAvailableNetworks";
import React from "react";

export enum MenuTabItems {
  ALL,
  PRODUCTS,
  REWARDS,
  ASSETS,
}
const TabsList: Array<{
  title: String;
  id: number;
}> = [
  { id: MenuTabItems.ALL, title: "All" },
  { id: MenuTabItems.PRODUCTS, title: "Products" },
  { id: MenuTabItems.REWARDS, title: "Rewards" },
  { id: MenuTabItems.ASSETS, title: "Assets" },
];

interface PortfolioMenuTabsProps {
  tabState: [activeTab: number, setActiveTab: React.Dispatch<React.SetStateAction<MenuTabItems>>];
}
const PortfolioMenuTabs: React.FC<PortfolioMenuTabsProps> = ({ tabState }) => {
  const { availableNetworks } = useAvailableNetworks();
  const { setSelectedNetwork, selectedNetwork } = usePortfolio();
  const [activeTab, setActiveTab] = tabState;
  return (
    <div className="grid grid-cols-12 mt-20 gap-8">
      <div className="col-span-12 md:col-span-3">
        <CustomDropdown
          selectedItem={selectedNetwork}
          setSelectedItem={setSelectedNetwork}
          categories={[{ id: "All", value: "All" }, ...availableNetworks]}
        />
      </div>
      <div className="col-span-12 md:col-span-4 md:col-end-13">
        <div className="flex justify-end space-x-4">
          {TabsList.map(({ id, title }) => (
            <button
              className={`border py-[14px] px-5 rounded-[28px] transition-all  ${
                activeTab == id ? "border-[#827D69] bg-[#827D69] text-white" : "border-customLightGray text-[#55503D]"
              }`}
              key={id}
              onClick={() => setActiveTab(id)}
            >
              {" "}
              {title}{" "}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioMenuTabs;
