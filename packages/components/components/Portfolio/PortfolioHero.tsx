import { ArrowSmallUpIcon, ArrowLongUpIcon } from "@heroicons/react/24/solid";
import HeroBgMobile from "../../public/images/portfolioHeroBgmobile.svg";
import HeroBg from "../../public/images/portfolioHeroBg.svg";
import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import NetworkFilter from "../../../greenfield-app/components/NetworkFilter";

import Image from "next/image";
import { BigNumber } from "ethers";
import { Tabs, TabsProps } from "../Tabs";

export interface PortfolioHeroProps {
  selectedNetworks: ChainId[];
  account?: `0x${string}`;
  vestingBalance: BigNumber;
  balance: BigNumber;
  supportedNetworks: any;
  selectNetwork: any;
  tabs: TabsProps;
}

const PortfolioHero: React.FC<PortfolioHeroProps> = ({
  supportedNetworks,
  vestingBalance,
  balance,
  selectNetwork,
  tabs,
}) => {
  return (
    <div className="bg-warmGray overflow-hidden md:bg-opacity-[15%] flex flex-col md:flex-row justify-between px-8 pt-10 pb-16 md:pb-[14px] relative -mt-5">
      <div className="relative z-1">
        <h1 className="text-3xl md:text-4xl font-normal m-0 leading-[38px] md:leading-11 mb-4">
          Your Portfolio Overview
        </h1>
        <p className="text-base text-primaryDark">
          A glance at your current Popcorn portfolio <br />
          across different networks.
        </p>
        <div className="hidden md:block mt-6">
          <NetworkFilter supportedNetworks={supportedNetworks} selectNetwork={selectNetwork} />
        </div>
      </div>
      <div className="absolute bottom-0 left-32 hidden md:block">
        <Image src={HeroBg} alt="" width={100} height={100} className="w-full h-[300px]" />
      </div>
      <div className="absolute right-5 top-16 md:hidden">
        <Image src={HeroBgMobile} alt="" width={100} height={100} className="w-full h-[126px]" />
      </div>
      <div>
        <div className="grid grid-cols-12 gap-4 md:gap-8 mt-8 md:mt-0">
          <div className="col-span-5 md:col-span-3">
            <div className="hidden">
              <p className="leading-6 text-base md:mb-2 font-light md:font-normal">Weekly P&L</p>
              <div className="md:rounded-lg md:bg-customLightGreen md:px-4 md:py-2 text-3xl md:text-base font-light md:font-medium text-customLightGreen md:text-white flex">
                <p> +20%</p> <ArrowSmallUpIcon className="w-6 hidden md:inline" />{" "}
                <ArrowLongUpIcon className="w-5 md:hidden" />{" "}
              </div>
            </div>
          </div>
          <div className="col-span-5 md:col-span-3">
            <div className="hidden">
              <p className="leading-6 text-base font-light md:font-normal">Deposits</p>
              <p className="text-3xl font-light md:font-medium">$81K</p>
            </div>
          </div>
          <div className="col-span-5 md:col-span-3">
            <p className="leading-6 text-base font-light md:font-normal">Vesting</p>
            <div className="text-3xl font-light md:font-medium">${formatAndRoundBigNumber(vestingBalance, 18)}</div>
          </div>
          <div className="col-span-5 md:col-span-3">
            <p className="leading-6 text-base font-light md:font-normal">Asset Value</p>
            <div className="text-3xl font-light md:font-medium">${formatAndRoundBigNumber(balance, 18)}</div>
          </div>
        </div>
        <div className="md:hidden">
          <NetworkFilter supportedNetworks={supportedNetworks} selectNetwork={selectNetwork} />
        </div>
        <div className="hidden md:flex flex-col items-end mt-16">
          <Tabs available={tabs.available} active={tabs.active} />
        </div>
      </div>
    </div>
  );
};

export default PortfolioHero;
