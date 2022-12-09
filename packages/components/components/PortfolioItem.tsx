import React from 'react'
import { NetworkSticker } from "@popcorn/app/components/NetworkSticker";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import PopIcon from "../stories/assets/POP.svg"
import EthIcon from "../stories/assets/ethereum.svg"

interface PortfolioItemProps {
  tokenName: string;
  chainId: number;
  token: string;
}
const PortfolioItem: React.FC<PortfolioItemProps> = ({ tokenName, chainId, token }) => {
  return (
    <div className="bg-customLightGray bg-opacity-[10%] rounded-2xl py-4 px-8">
      <div className="grid grid-cols-12">
        <div className="flex space-x-[52px] col-span-6">
          <div className='relative'>
            <div className="absolute top-0 -left-4">
              <img
                src={EthIcon}
                alt="network logo"
                className='w-6 h-6'
              />
            </div>
            <img src={PopIcon} alt="token icon" className={"w-10 h-10"} />
          </div>
          <div>
            <p className="font-medium text-lg">{tokenName}</p>
            <p className="text-tokenTextGray">Ethereum</p>
          </div>
        </div>

        <div className="col-span-6 grid grid-cols-12">
          <p className="text-primary text-lg font-medium col-span-4">$0.35</p>
          <p className="text-primary text-lg font-medium col-span-4">12.34%</p>
          <div className='col-span-4'>
            <p className="text-primary text-lg font-medium">$10K</p>
            <p className="text-tokenTextGray">10K POP</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioItem