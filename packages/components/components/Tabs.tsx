import { useState, createContext, useContext, Dispatch, SetStateAction, FC } from "react";
import classnames from "classnames";

const removeSpaces = (word: string) => {
  return word.replace(/\s/g, "_");
};

const TabSwitcherContext = createContext({} as [string, Dispatch<SetStateAction<string>>]);

interface Tab {
  label: string;
}

// interface TabSwitcherProps {
//   children: React.ReactNode;
//   tabs: Tabs[];
//   defaultActiveTab: string;
// }

// const TabSwitcher: FC<TabSwitcherProps> = ({ children, tabs, defaultActiveTab }) => {
//   const [activeTab, setActiveTab] = useState(defaultActiveTab ?? "");
//   return <TabSwitcherContext.Provider value={[activeTab, setActiveTab]}>{children}</TabSwitcherContext.Provider>;
// };

interface TabProps {
  tabs: Tab[];
  activeTab: { label: string };
  setActiveTab: (tab: Tab) => void;
}

export const Tabs: FC<TabProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex">
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

// interface TabPanelProps {
//   whenActive: string;
//   children: React.ReactNode;
// }

// const TabPanel: FC<TabPanelProps> = ({ whenActive, children }) => {
//   const [activeTab] = useContext(TabSwitcherContext);
//   return (
//     <div
//       className={classnames({
//         hidden: activeTab !== whenActive,
//       })}
//     >
//       {children}
//     </div>
//   );
// };

// export default TabSwitcher;
// export { TabPanel, Tab };
//  export default Tab
