import { Transition } from "@headlessui/react";
import Assets from "@popcorn/app/components/Portfolio/Assets/Assets";
import NetWorthCard from "@popcorn/app/components/Portfolio/NetWorthCard";
import PortfolioHero from "@popcorn/app/components/Portfolio/PortfolioHero";
import PortfolioMenuTabs, { MenuTabItems } from "@popcorn/app/components/Portfolio/PortfolioMenuTabs";
import ProductsCon from "@popcorn/app/components/Portfolio/Products/ProductsCon";
import Rewards from "@popcorn/app/components/Portfolio/Rewards/Rewards";
import React, { useState } from "react";

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState(MenuTabItems.ALL);

  const portfolios = [
    {
      component: ProductsCon,
      show: activeTab === MenuTabItems.ALL || activeTab === MenuTabItems.PRODUCTS,
    },
    {
      component: Rewards,
      show: activeTab === MenuTabItems.ALL || activeTab === MenuTabItems.REWARDS,
    },
    {
      component: Assets,
      show: activeTab === MenuTabItems.ALL || activeTab === MenuTabItems.ASSETS,
    },
  ];

  return (
    <>
      <PortfolioHero />
      <PortfolioMenuTabs tabState={[activeTab, setActiveTab]} />
      <div className="grid grid-cols-12 gap-8 mt-10">
        <div className="col-span-12 md:col-span-3">
          <NetWorthCard />
        </div>
        <div className="col-span-12 md:col-span-9">
          {portfolios.map((portfolio, index) => (
            <Transition
              key={index}
              show={portfolio.show}
              enter="transition-opacity ease-in-out duration-75"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-in-out duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <portfolio.component />
            </Transition>
          ))}
        </div>
      </div>
    </>
  );
};

export default Portfolio;
