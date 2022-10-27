import { Transition } from "@headlessui/react";
import NetWorthCard from "components/Portfolio/NetWorthCard";
import PortfolioHero from "components/Portfolio/PortfolioHero";
import PortfolioMenuTabs, { MenuTabItems } from "components/Portfolio/PortfolioMenuTabs";
import ProductsCon from "components/Portfolio/Products/ProductsCon";
import React, { useState } from "react";

const portfolio = () => {
  const [activeTab, setActiveTab] = useState(MenuTabItems.ALL);

  return (
    <>
      <PortfolioHero />
      <PortfolioMenuTabs tabState={[activeTab, setActiveTab]} />
      <div className="grid grid-cols-12 gap-8 mt-10">
        <div className="col-span-12 md:col-span-3">
          <NetWorthCard />
        </div>
        <div className="col-span-12 md:col-span-9">
          <Transition
            show={activeTab == MenuTabItems.ALL || activeTab == MenuTabItems.PRODUCTS}
            enter="transition-opacity ease-in-out duration-75"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ProductsCon />
          </Transition>
          <Transition
            show={activeTab == MenuTabItems.ALL || activeTab == MenuTabItems.REWARDS}
            enter="transition-opacity ease-in-out duration-75"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* <PortfolioCardCon cardTitle="Rewards" /> */}
          </Transition>
          <Transition
            show={activeTab == MenuTabItems.ALL || activeTab == MenuTabItems.ASSETS}
            enter="transition-opacity ease-in-out duration-75"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* <PortfolioCardCon cardTitle="Assets" /> */}
          </Transition>
        </div>
      </div>
    </>
  );
};

export default portfolio;
