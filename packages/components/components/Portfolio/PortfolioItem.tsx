import React from "react";
import { Badge, BadgeVariant } from "../Badge";

export interface PortfolioItemProps {
  tokenName: string;
  tokenIcon: JSX.Element;
  contractIcon: string;
  token: string;
  portfolioValues: Array<{ value: string | JSX.Element; hideMobile: boolean }>;
  badge?: { label: string; variant: BadgeVariant };
}

const PortfolioItem: React.FC<PortfolioItemProps> = ({
  tokenName,
  tokenIcon,
  token,
  portfolioValues,
  badge,
  contractIcon,
}) => {
  const filterHiddenMobile = () => portfolioValues.filter((value) => !value.hideMobile);

  return (
    <div className="md:bg-customLightGray md:bg-opacity-[10%] rounded-2xl py-4">
      <div className="grid grid-cols-12">
        <div
          className={`flex items-center space-x-4 md:space-x-[52px] md:col-span-6 md:pl-8 ${
            filterHiddenMobile().length === 1 ? "col-span-6" : "col-span-5"
          }`}
        >
          <div className="relative">
            <div className="absolute top-0 -left-4">
              <img src={contractIcon} alt="network logo" className="w-6 h-6" />
            </div>
            {tokenIcon}
          </div>

          <div className="flex space-x-[6px] md:space-x-[52px]">
            <div>
              <p className="font-medium text-xs md:text-lg">{tokenName}</p>
              <p className="text-tokenTextGray text-[10px] md:text-base">{token}</p>
            </div>
            {badge && <Badge variant={badge.variant}> {badge?.label}</Badge>}
          </div>
        </div>

        <div
          className={`md:col-span-6 grid grid-cols-12 ${
            filterHiddenMobile().length === 1 ? "col-span-6" : "col-span-7"
          }`}
        >
          {portfolioValues.map(({ value, hideMobile }, index) => (
            <div
              className={`text-primary text-xs md:text-lg font-medium col-span-6 md:col-span-4 ${
                hideMobile ? "hidden md:block" : filterHiddenMobile().length === 1 ? " col-end-13" : ""
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
