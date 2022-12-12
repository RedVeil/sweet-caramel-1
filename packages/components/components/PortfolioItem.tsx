import React from "react";
import PopIcon from "../stories/assets/POP.svg";
import EthIcon from "../stories/assets/ethereum.svg";
import { Badge, BadgeVariant } from "./Badge";

export interface PortfolioItemProps {
  tokenName: string;
  chainId: number;
  token: string;
  portfolioValues: Array<{ value: string | JSX.Element; hideMobile: boolean }>;
  badge?: { label: string; variant: BadgeVariant };
}
const PortfolioItem: React.FC<PortfolioItemProps> = ({ tokenName, chainId, token, portfolioValues, badge }) => {
  return (
    <div className="md:bg-customLightGray md:bg-opacity-[10%] rounded-2xl py-4">
      <div className="grid grid-cols-12">
        <div className="flex space-x-4 md:space-x-[52px] col-span-5 md:col-span-6 md:pl-8">
          <div className="relative">
            <div className="absolute top-0 -left-4">
              <img src={EthIcon} alt="network logo" className="w-6 h-6" />
            </div>
            <img src={PopIcon} alt="token icon" className={"w-10 h-10"} />
          </div>
          <div>
            <p className="font-medium text-xs md:text-lg">{tokenName}</p>
            <p className="text-tokenTextGray text-[10px] md:text-base">{token}</p>
          </div>
          {badge && <Badge variant={badge.variant}> {badge?.label}</Badge>}
        </div>

        <div className="col-span-7 md:col-span-6 grid grid-cols-12">
          {portfolioValues.map(({ value, hideMobile }, index) => (
            <div
              className={`text-primary text-xs md:text-lg font-medium col-span-6 md:col-span-4 ${
                hideMobile ? "hidden md:block" : ""
              }`}
              key={index}
            >
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioItem;
