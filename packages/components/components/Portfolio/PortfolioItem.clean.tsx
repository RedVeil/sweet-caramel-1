import type { BigNumber } from "ethers";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import type { PropsWithChildren } from "react";
import React from "react";
import { Badge, BadgeVariant } from "../Badge";

export interface PortfolioItemProps {
  tokenName: string;
  tokenIcon: JSX.Element;
  networkSticker: JSX.Element;
  token: string;
  badge?: { label: string; variant: BadgeVariant };
  data: {
    positionPercentage: BigNumber;
    price: BigNumber;
    balance: BigNumber;
  };
}

const PortfolioItem: React.FC<PortfolioItemProps> = ({ tokenName, tokenIcon, token, badge, networkSticker, data }) => {
  return (
    <div className="md:bg-customLightGray md:bg-opacity-[10%] mb-4 rounded-2xl py-4">
      <div className="grid grid-cols-12">
        <div className="flex items-center space-x-4 md:space-x-[52px] col-span-6 md:pl-8">
          <div className="relative">
            {networkSticker}
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

        <div className="col-span-6 grid grid-cols-12">
          <ContentWrapper>${data.price.toString()}</ContentWrapper>
          <ContentWrapper>{data.positionPercentage.toString()}%</ContentWrapper>
          <ContentWrapper>${formatAndRoundBigNumber(data.balance, 18)}</ContentWrapper>
        </div>
      </div>
    </div>
  );
};

function ContentWrapper({ children }: PropsWithChildren) {
  return (
    <div className="text-primary text-xs md:text-lg font-medium col-span-6 md:col-span-4 later:hidden md:block col-end-13">
      {children}
    </div>
  );
}

export default PortfolioItem;
