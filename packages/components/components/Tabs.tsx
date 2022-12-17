import { FC } from "react";
import classnames from "classnames";
interface Tab {
  label: string;
}
interface TabProps {
  tabs: Tab[];
  activeTab: { label: string };
  setActiveTab: (tab: Tab) => void;
}

export const Tabs: FC<TabProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-4">
      {tabs.map((tab) => (
        <button
          className={classnames(
            "flex items-center justify-center rounded-3xl py-3 px-5 text-base leading-6 font-normal",
            {
              "border-primary bg-primaryLight text-white": tab.label === activeTab.label,
              "bg-white border border-[#d7d7d799]": tab.label !== activeTab.label,
            },
          )}
          onClick={() => setActiveTab(tab)}
          key={tab.label}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
