import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioPage from "../components/PortfolioPage";
import TooltipIcon from "../stories/assets/tooltip.svg";
import { BadgeVariant } from "../components/Badge";
import EthIcon from "./assets/ethereum.svg";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Tabs } from "../components/Tabs";

export default {
  title: "Pages/PortfolioPage",
  component: PortfolioPage,
  layout: "fullscreen",
} as ComponentMeta<typeof PortfolioPage>;

const networks = [
  {
    icon: EthIcon,
    isActive: true,
    label: "All Networks",
    handleClick: () => console.log("switch"),
  },
  {
    icon: EthIcon,
    isActive: false,
    label: "Ethereum",
    handleClick: () => console.log("switch"),
  },
  {
    icon: EthIcon,
    isActive: false,
    label: "Polygon",
    handleClick: () => console.log("switch"),
  },
];
const NetworkSwitcher = (
  <div>
    <div className="hidden md:flex flex-row items-center space-x-2 mt-6">
      {networks.map(({ label, handleClick, isActive }) => (
        <button
          key={label}
          className={`leading-8 h-12 w-18 bg-white border border-customLightGray rounded-3xl text-primary flex justify-center items-center ${
            isActive ? "border-1 border-tokenTextGray" : "border-customLightGray"
          }`}
          type="button"
          onClick={() => handleClick()}
        >
          <img src={EthIcon} alt={label} className="w-4 h-4 object-contain" />
        </button>
      ))}
    </div>
    <button className="w-full py-3 px-5 flex md:hidden flex-row items-center justify-between space-x-1 rounded-4xl border border-gray-300 bg-white mt-8">
      <div className="flex items-center">All Networks</div>
      <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
    </button>
  </div>
);

const Template: ComponentStory<typeof PortfolioPage> = (args) => <PortfolioPage {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  NetworkSwitcher,
  sections: [
    {
      title: "Assets",
      PortfolioItems: [
        {
          tokenName: "Test Modal",
          chainId: 1,
          token: "Popcorn",
          portfolioValues: [
            {
              value: "$0.35",
              hideMobile: true,
            },
            {
              value: "0.1234%",
              hideMobile: false,
            },
            {
              value: (
                <>
                  <p>$10K</p>
                  <p className="text-tokenTextGray text-[10px] md:text-base">10K POP</p>
                </>
              ),
              hideMobile: false,
            },
          ],
        },
        {
          tokenName: "Test Modal",
          chainId: 1,
          token: "Popcorn",
          portfolioValues: [
            {
              value: "$0.35",
              hideMobile: true,
            },
            {
              value: "0.1234%",
              hideMobile: false,
            },
            {
              value: (
                <>
                  <p>$10K</p>
                  <p className="text-tokenTextGray text-[10px] md:text-base">10K POP</p>
                </>
              ),
              hideMobile: false,
            },
          ],
          badge: {
            variant: BadgeVariant.primary,
            label: "Claimable",
          },
        },
        {
          tokenName: "Test Modal",
          chainId: 1,
          token: "Popcorn",
          portfolioValues: [
            {
              value: "$0.35",
              hideMobile: true,
            },
            {
              value: "0.1234%",
              hideMobile: false,
            },
            {
              value: (
                <>
                  <p>$10K</p>
                  <p className="text-tokenTextGray text-[10px] md:text-base">10K POP</p>
                </>
              ),
              hideMobile: false,
            },
          ],
          badge: {
            variant: BadgeVariant.dark,
            label: "Vesting",
          },
        },
      ],
      TotalValues: [
        {
          title: "Price",
          value: "$0.35",
          tooltip: <img src={TooltipIcon} alt="tooltip" className={`cursor-pointer w-4 h-4`} />,
          hideMobile: true,
        },
        {
          title: "Portfolio %",
          value: "50.23%",
          tooltip: <img src={TooltipIcon} alt="tooltip" className={`cursor-pointer w-4 h-4`} />,
          hideMobile: false,
        },
        {
          title: "Balance",
          value: "$40K",
          tooltip: <img src={TooltipIcon} alt="tooltip" className={`cursor-pointer w-4 h-4`} />,
          hideMobile: false,
        },
      ],
    },
  ],
};
