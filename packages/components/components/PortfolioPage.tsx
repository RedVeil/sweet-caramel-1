import React, { FC, useState } from "react";
import PortfolioHero, { PortfolioHeroProps } from "./PortfolioHero";
import PortfolioSection, { PortfolioSectionProps } from "./PortfolioSection";
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
      />

      <div className="mt-7">
        {sections.map((section, index) => (
          <div key={index} className={activeTab.label === "All" || activeTab.label === section.title ? "" : "hidden"}>
            <PortfolioSection {...section} />
          </div>
        ))}
      </div>
    </main>
  );
};

export default PortfolioPage;
