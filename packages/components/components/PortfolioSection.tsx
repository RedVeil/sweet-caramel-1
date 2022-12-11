import React from "react";
import PortfolioItem, { PortfolioItemProps } from "./PortfolioItem";
import EthIcon from "../stories/assets/ethereum.svg";

interface PortfolioSectionProps {
  title: string;
  PortfolioItems: Array<PortfolioItemProps>;
  TotalValues: Array<{
    title: string;
    tooltip: JSX.Element;
    value: string | JSX.Element;
    hideMobile: boolean;
  }>;
}
const PortfolioSection: React.FC<PortfolioSectionProps> = ({ title, PortfolioItems, TotalValues }) => {
  return (
    <div className=" font-khTeka">
      <div className="grid grid-cols-12 pb-4 md:pb-0 border-b-[0.5px] md:border-b-0 border-customLightGray">
        <div className="col-span-5 md:col-span-6 flex items-center space-x-10 mb-6 md:mb-[42px]">
          <h2 className="text-2xl md:text-3xl leading-6">{title}</h2>
          <div className="relative">
            <div className="absolute top-0 -left-5">
              <img src={EthIcon} alt="network logo" className="w-6 h-6" />
            </div>
            <div className="">
              <img src={EthIcon} alt="network logo" className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6 grid grid-cols-12">
          <div className="col-span-7 col-end-13 md:col-span-12 grid grid-cols-12">
            {TotalValues.map(({ title, tooltip, value, hideMobile }, index) => (
              <div
                className={`text-primary text-lg font-medium col-span-6 md:col-span-4 ${
                  hideMobile ? "hidden md:block" : ""
                }`}
                key={index}
              >
                <div className="flex items-center space-x-2">
                  <p className="text-primaryLight text-sm md:text-base">{title}</p>
                  {tooltip}
                </div>
                <p className="text-sm md:text-lg">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        {PortfolioItems.map((items) => (
          <div key={items.tokenName} className="mb-4">
            <PortfolioItem {...items} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSection;
