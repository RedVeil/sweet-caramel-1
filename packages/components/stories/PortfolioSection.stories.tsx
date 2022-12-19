import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioSection from "../components/Portfolio/PortfolioSection";
import TooltipIcon from "../stories/assets/tooltip.svg";
import { BadgeVariant } from "../components/Badge";
import EthIcon from "./assets/ethereum.svg";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import POPIcon from "./assets/POP.svg";
import PortfolioItem from "../components/Portfolio/PortfolioItem";

export default {
  title: "Components/PortfolioSection",
  component: PortfolioSection,
} as ComponentMeta<typeof PortfolioSection>;
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
    <div className="hidden md:flex flex-row items-center space-x-2">
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

const PortfolioItemsChildren = () => {
  const itemProps = [
    {
      tokenName: "POP",
      token: "Popcorn",
      networkSticker: <img src={EthIcon} alt="token icon" className="w-6 h-6" />,
      tokenIcon: <img src={POPIcon} alt="token icon" className={`w-6 h-6`} />,
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
      tokenName: "Arrakis",
      token: "Popcorn",
      networkSticker: <img src={EthIcon} alt="token icon" className="w-6 h-6" />,
      tokenIcon: <img src={POPIcon} alt="token icon" className={`w-6 h-6`} />,
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
      tokenName: "3X",
      token: "Popcorn",
      networkSticker: <img src={EthIcon} alt="token icon" className="w-6 h-6" />,
      tokenIcon: <img src={POPIcon} alt="token icon" className={`w-6 h-6`} />,
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
  ];
  return (
    <>
      {itemProps.map((props, index) => (
        <PortfolioItem key={index} {...props} />
      ))}
    </>
  );
};

const Template: ComponentStory<typeof PortfolioSection> = (args) => <PortfolioSection {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  title: "Assets",
  children: <PortfolioItemsChildren />,
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
  NetworkIcons: NetworkSwitcher,
};
