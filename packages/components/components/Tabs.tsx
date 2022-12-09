import { useState, createContext, useContext, Dispatch, SetStateAction, FC } from "react";
import classnames from "classnames";

const removeSpaces = (word: string) => {
  return word.replace(/\s/g, "_");
};

const TabSwitcherContext = createContext({} as [string, Dispatch<SetStateAction<string>>]);

interface Tabs {
  label: string;
}

interface TabSwitcherProps {
  children: React.ReactNode;
  tabs: Tabs[];
  defaultActiveTab?: string;
}

const TabSwitcher: FC<TabSwitcherProps> = ({ children, tabs, defaultActiveTab }) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab ?? tabs[0].label);
  return (
    <TabSwitcherContext.Provider value={[activeTab, setActiveTab]}>
      <div className="flex flex-row space-x-4">
        {tabs.map((tab) => (
          <Tab key={removeSpaces(tab.label)} label={tab.label} />
        ))}
      </div>
      {children}
    </TabSwitcherContext.Provider>
  );
};

interface TabProps {
  label: string;
}

const Tab: FC<TabProps> = ({ label }) => {
  const [activeTab, setActiveTab] = useContext(TabSwitcherContext);
  return (
    <button
      className={classnames("flex items-center justify-center rounded-3xl py-3 px-5 text-base leading-6 font-normal", {
        "border-primary bg-primaryLight text-white": label === activeTab,
        "bg-white border border-[#d7d7d799]": label !== activeTab,
      })}
      onClick={() => setActiveTab(label)}
    >
      {label}
    </button>
  );
};

interface TabPanelProps {
  whenActive: string;
  children: React.ReactNode;
}

const TabPanel: FC<TabPanelProps> = ({ whenActive, children }) => {
  const [activeTab] = useContext(TabSwitcherContext);
  return (
    <div
      className={classnames({
        hidden: activeTab !== whenActive,
      })}
    >
      {children}
    </div>
  );
};

export default TabSwitcher;
export { TabPanel };
