import NetWorthCard from "components/Portfolio/NetWorthCard";
import PortfolioCardCon from "components/Portfolio/PortfolioCardCon";
import PortfolioHero from "components/Portfolio/PortfolioHero";
import PortfolioMenuTabs from "components/Portfolio/PortfolioMenuTabs";
import React from "react";

const portfolio = () => {
  return (
    <>
      <PortfolioHero />
      <PortfolioMenuTabs />
      <div className="grid grid-cols-12 gap-8 mt-10">
        <div className="col-span-12 md:col-span-3">
          <NetWorthCard />
        </div>
        <div className="col-span-12 md:col-span-9">
          <PortfolioCardCon cardTitle="Products" />
          <PortfolioCardCon cardTitle="Rewards" />
          <PortfolioCardCon cardTitle="Assets" />
        </div>
      </div>
    </>
  );
};

export default portfolio;
