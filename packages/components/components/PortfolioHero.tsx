import React, { useState } from "react";
import { ArrowSmallUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import TabSwitcher from "./Tabs";
import { Menu } from "@headlessui/react";
import Dropdown from "./Dropdown";
import HeroBg from "../stories/assets/portfolioHeroBg.svg";

interface PortfolioHeroProps {
  title: string;
  NetworkSwitcher: JSX.Element;
}
const PortfolioHero: React.FC<PortfolioHeroProps> = ({ title, NetworkSwitcher }) => {
  const tabs = [{ label: "All" }, { label: "Products" }, { label: "Rewards" }, { label: "Assets" }];

  const options = [
    { id: "1", value: "50%" },
    { id: "2", value: "100%" },
  ];
  const [selectedOption, setSelectedOption] = useState({ id: "1", value: "50" });
  return (
    <div className="bg-warmGray bg-opacity-[15%] flex justify-between px-8 pt-10 pb-[14px] relative">
      <div className="relative z-20">
        <h1 className="text-4xl font-normal m-0 leading-11 mb-4">Your Portfolio Overview</h1>
        <p className=" text-base text-primaryDark">
          A glance at your current Popcorn portfolio <br />
          across different networks.
        </p>
        {NetworkSwitcher}
      </div>
      <div className="absolute bottom-0 left-32">
        <img src={HeroBg} alt="" className="w-full" />
      </div>
      <div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <p className="leading-6 text-base mb-2">Weekly P&L</p>
            <div className="rounded-lg bg-customLightGreen px-4 py-2 text-base font-medium text-white">
              + 20% <ArrowSmallUpIcon className="w-6" />{" "}
            </div>
          </div>
          <div className="col-span-3">
            <p className="leading-6 text-base">Deposits</p>
            <p className="text-3xl font-medium">$81K</p>
          </div>
          <div className="col-span-3">
            <p className="leading-6 text-base">Vesting</p>
            <p className="text-3xl font-medium">$81K</p>
          </div>
          <div className="col-span-3">
            <p className="leading-6 text-base">POP In Wallet</p>
            <p className="text-3xl font-medium">$81K</p>
          </div>
        </div>
        <div className="flex flex-col items-end mt-16">
          <TabSwitcher tabs={tabs} defaultActiveTab="All" />
          <div className="mt-9 relative">
            <Dropdown
              options={options}
              position="absolute top-14 left-0 z-40"
              width="w-full"
              selectedItem={selectedOption}
              switchFilter={setSelectedOption}
              label="Highest holding %"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioHero;
