import { Tabs } from "pages/rewards";
import { Dispatch } from "react";

interface TabSelectorProps {
  activeTab: Tabs;
  setActiveTab: Dispatch<Tabs>;
  availableTabs: Tabs[];
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, setActiveTab, availableTabs }) => {
  return (
    <div className="flex flex-row">
      {availableTabs.map((tab) => (
        <div
          key={tab}
          className={`w-1/2 cursor-pointer ${
            activeTab === tab ? "border-b-2 border-blue-600" : "border-b border-gray-400  group hover:border-gray-600"
          }`}
          onClick={(e) => setActiveTab(tab)}
        >
          <p
            className={`text-center text-base mb-4 cursor-pointer ${
              activeTab === tab ? "text-blue-600 font-semibold" : "text-gray-400 group-hover:text-gray-600"
            }`}
          >
            {tab}
          </p>
        </div>
      ))}
    </div>
  );
};
export default TabSelector;
