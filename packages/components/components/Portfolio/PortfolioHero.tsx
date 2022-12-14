import React, { useState } from "react";
import { ArrowSmallUpIcon, ArrowLongUpIcon } from "@heroicons/react/24/solid";
import Dropdown from "../Dropdown";
import HeroBg from "../../stories/assets/portfolioHeroBg.svg";
import HeroBgMobile from "../../stories/assets/portfolioHeroBgmobile.svg";
import { ChainId } from "@popcorn/utils";
import { PopBalanceOf } from "@popcorn/components/lib/Contract";
import { useSupportedContracts } from "@popcorn/components/hooks";
export interface PortfolioHeroProps {
  NetworkSwitcher: JSX.Element;
  TabButtons: JSX.Element;
  selectedNetworks: ChainId[];
}
const PortfolioHero: React.FC<PortfolioHeroProps> = ({ NetworkSwitcher, TabButtons, selectedNetworks }) => {
  const account = "0x4f20cb7a1d567a54350a18dacb0cc803aebb4483";
  const options = [
    { id: "1", value: "50%" },
    { id: "2", value: "100%" },
  ];
  const [selectedOption, setSelectedOption] = useState({ id: "1", value: "50" });
  const selectedContracts = useSupportedContracts(selectedNetworks);

  return (
    <div className="bg-warmGray md:bg-opacity-[15%] flex flex-col md:flex-row justify-between px-8 pt-10 pb-16 md:pb-[14px] relative">
      <div className="relative z-20">
        <h1 className="text-3xl md:text-4xl font-normal m-0 leading-[38px] md:leading-11 mb-4">
          Your Portfolio Overview
        </h1>
        <p className="text-base text-primaryDark">
          A glance at your current Popcorn portfolio <br />
          across different networks.
        </p>
        <div className="hidden md:block mt-6">{NetworkSwitcher}</div>
      </div>
      <div className="absolute bottom-0 left-32 hidden md:block">
        <img src={HeroBg} alt="" className="w-full" />
      </div>
      <div className="absolute right-5 top-16 md:hidden">
        <img src={HeroBgMobile} alt="" className="w-full" />
      </div>
      <div>
        <div className="grid grid-cols-12 gap-4 md:gap-8 mt-8 md:mt-0">
          <div className="col-span-5 md:col-span-3">
            <p className="leading-6 text-base md:mb-2 font-light md:font-normal">Weekly P&L</p>
            <div className="md:rounded-lg md:bg-customLightGreen md:px-4 md:py-2 text-3xl md:text-base font-light md:font-medium text-customLightGreen md:text-white flex">
              <p> +20%</p> <ArrowSmallUpIcon className="w-6 hidden md:inline" />{" "}
              <ArrowLongUpIcon className="w-5 md:hidden" />{" "}
            </div>
          </div>
          <div className="col-span-5 md:col-span-3">
            <p className="leading-6 text-base font-light md:font-normal">Deposits</p>
            <p className="text-3xl font-light md:font-medium">$81K</p>
          </div>
          <div className="col-span-5 md:col-span-3">
            <p className="leading-6 text-base font-light md:font-normal">Vesting</p>
            <p className="text-3xl font-light md:font-medium">$81K</p>
          </div>
          <div className="col-span-5 md:col-span-3">
            <p className="leading-6 text-base font-light md:font-normal">POP In Wallet</p>
            <div className="text-3xl font-light md:font-medium">
              <PopBalanceOf selectedContracts={selectedContracts} account={account} />
            </div>
          </div>
        </div>
        <div className="md:hidden">{NetworkSwitcher}</div>
        <div className="hidden md:flex flex-col items-end mt-16">
          {TabButtons}
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
