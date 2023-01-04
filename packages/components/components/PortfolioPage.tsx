import React, { FC, useState } from "react";
import PortfolioHero, { PortfolioHeroProps } from "./Portfolio/PortfolioHero";
import PortfolioSection, { PortfolioSectionProps } from "./Portfolio/PortfolioSection";
import { Tabs } from "../components/Tabs";

interface PortfolioPageProps {
  NetworkSwitcher: JSX.Element;
  sections: Array<PortfolioSectionProps>;
}
const tabs = [{ label: "All" }, { label: "Products" }, { label: "Rewards" }, { label: "Assets" }];

const PortfolioPage: FC<PortfolioPageProps> = ({ NetworkSwitcher, sections }) => {
  const [activeTab, setActiveTab] = useState({ label: "All" });
  return (
    <main>
      <PortfolioHero
        NetworkSwitcher={NetworkSwitcher}
        TabButtons={<Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />}
        selectedNetworks={[0, 1, 1337, 137]}
        filterState={[{ id: "1", value: "test" }, () => console.log("filter")]}
      />

      <div className="mt-7">
        {sections.map((section, index) => (
          <div key={index} className={activeTab.label === "All" || activeTab.label === section.title ? "" : "hidden"}>
            <PortfolioSection {...section}>{section.children}</PortfolioSection>
          </div>
        ))}
      </div>
    </main>
  );
};

export default PortfolioPage;
