import React from 'react'
import PortfolioItem, { PortfolioItemProps } from './PortfolioItem'
import EthIcon from "../stories/assets/ethereum.svg";

interface PortfolioSectionProps {
  title: string;
  PortfolioItems: Array<PortfolioItemProps>;
  TotalValues: Array<{
    title: string;
    tooltip: JSX.Element;
    value: string | JSX.Element;
  }>
}
const PortfolioSection: React.FC<PortfolioSectionProps> = ({ title, PortfolioItems, TotalValues }) => {
  return (
    <div className=" font-khTeka">
      <div className='grid grid-cols-12'>
        <div className="col-span-6 flex items-center space-x-10 mb-[42px]">
          <h2 className="text-3xl">{title}</h2>
          <div className="relative">
            <div className="absolute top-0 -left-5">
              <img src={EthIcon} alt="network logo" className="w-6 h-6" />
            </div>
            <div className="">
              <img src={EthIcon} alt="network logo" className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="col-span-6 grid grid-cols-12">
          {TotalValues.map((totalValue, index) => <div className="text-primary text-lg font-medium col-span-4" key={index}>
            <div className='flex items-center space-x-2'>
              <p className='text-primaryLight text-base'>{totalValue.title}</p>
              {totalValue.tooltip}
            </div>
            <p>{totalValue.value}</p>
          </div>)}
        </div>
      </div>
      <div>
        {PortfolioItems.map(items => <div key={items.tokenName} className="mb-4"><PortfolioItem {...items} /></div>)}
      </div>
    </div>
  )
}

export default PortfolioSection