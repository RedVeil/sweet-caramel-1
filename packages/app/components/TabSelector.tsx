import { Dispatch } from "react";

interface TabSelectorProps {
  activeTab: number;
  setActiveTab: Dispatch<number>;
  labels: string[];
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, setActiveTab, labels }) => {
  return (
    <div className="flex flex-row">
      {labels.map((label, i) => (
        <div
          key={i}
          className={`w-1/2 ${
            activeTab === i
              ? "border-b-2 border-blue-600"
              : "border-b border-gray-400 cursor-pointer group hover:border-gray-600"
          }`}
          onClick={(e) => setActiveTab(i)}
        >
          <p
            className={`text-center text-base mb-4 ${
              activeTab === i ? "text-blue-600 font-semibold" : "text-gray-400 group-hover:text-gray-600"
            }`}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
};
export default TabSelector;
