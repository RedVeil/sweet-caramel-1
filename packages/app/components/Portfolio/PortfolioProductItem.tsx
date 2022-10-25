import StatusWithLabel, { InfoIconProps } from "components/Common/StatusWithLabel";
import TokenIcon from "components/TokenIcon";
import React from "react";
import { useChainIdFromUrl } from "../../hooks/useChainIdFromUrl";

export interface PortfolioProductItemProps {
  tokenName: string;
  tokenStatusLabels: Array<{
    content: string;
    label: string | React.ReactElement;
    infoIconProps?: InfoIconProps;
    emissions?: string;
  }>;
}
const PortfolioProductItem: React.FC<PortfolioProductItemProps> = ({ tokenName, tokenStatusLabels }) => {
  const chainId = useChainIdFromUrl();
  return (
    <div className="bg-customLightGray bg-opacity-25 rounded-lg grid grid-cols-12 p-6 mb-4">
      <div className="col-span-12 md:col-span-4 flex items-center">
        <TokenIcon token={tokenName} chainId={chainId} fullsize />
        <h5 className="text-xl md:ml-2 mb-2 md:mb-0">{tokenName}</h5>
      </div>

      <div
        className={`col-span-12 md:col-span-${tokenStatusLabels.length * 2}  md:col-end-13 grid grid-cols-${
          tokenStatusLabels.length * 2
        }`}
      >
        {tokenStatusLabels.map((props, index) => (
          <div className="col-span-12 md:col-span-2" key={index}>
            <StatusWithLabel {...props} isSmall />
            <p className="text-tokenTextGray text-sm leading-6">{props.emissions}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioProductItem;
