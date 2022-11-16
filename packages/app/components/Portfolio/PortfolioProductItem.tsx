import { ChainId } from "@popcorn/utils";
import StatusWithLabel, { InfoIconProps } from "@popcorn/app/components/Common/StatusWithLabel";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import React from "react";

export interface PortfolioProductItemProps {
  tokenName: string;
  tokenIcon: {
    address: string;
    chainId: ChainId;
  };
  tokenStatusLabels: Array<{
    content?: string;
    image?: React.ReactElement;
    label: string | React.ReactElement;
    infoIconProps?: InfoIconProps;
    emissions?: string;
  }>;
}
const PortfolioProductItem: React.FC<PortfolioProductItemProps> = ({ tokenName, tokenIcon, tokenStatusLabels }) => {
  return (
    <div className="bg-customLightGray bg-opacity-25 rounded-lg grid grid-cols-12 p-6 mb-4">
      <div className="col-span-12 md:col-span-4 flex items-center">
        <TokenIcon token={tokenIcon.address} chainId={tokenIcon.chainId} fullsize />
        <h5 className="text-xl md:ml-2 mb-2 md:mb-0">{tokenName}</h5>
      </div>

      <div
        className={`col-span-12 md:col-span-${tokenStatusLabels.length * 2}  md:col-end-13 grid grid-cols-${
          tokenStatusLabels.length * 3
        }
					}`}
      >
        {tokenStatusLabels.map((props, index) => (
          <div className="col-span-12 md:col-span-3" key={index}>
            <StatusWithLabel {...props} isSmall />
            <p className="text-tokenTextGray text-sm leading-6">{props.emissions}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioProductItem;
