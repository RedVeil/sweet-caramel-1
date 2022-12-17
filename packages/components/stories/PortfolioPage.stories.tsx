import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioPage from "../components/PortfolioPage";
import TooltipIcon from "../stories/assets/tooltip.svg";
import EthIcon from "./assets/ethereum.svg";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import POPIcon from "./assets/POP.svg";
import PortfolioItem from "../components/Portfolio/PortfolioItem";
import Image from "next/image";

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
      networkSticker: (
        <div className="absolute top-0 -left-4">
          <Image src={EthIcon} height="24" alt="token icon" width="24" objectFit="contain" />
        </div>
      ),
      tokenIcon: <Image src={POPIcon} height="32" alt="token icon" width="32" objectFit="contain" />,
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
      networkSticker: (
        <div className="absolute top-0 -left-4">
          <Image src={EthIcon} height="24" alt="token icon" width="24" objectFit="contain" />
        </div>
      ),
      tokenIcon: <Image src={POPIcon} height="32" alt="token icon" width="32" objectFit="contain" />,
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
      networkSticker: (
        <div className="absolute top-0 -left-4">
          <Image src={EthIcon} height="24" alt="token icon" width="24" objectFit="contain" />
        </div>
      ),
      tokenIcon: <Image src={POPIcon} height="32" alt="token icon" width="32" objectFit="contain" />,
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

const Template: ComponentStory<typeof PortfolioPage> = (args) => <PortfolioPage {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  NetworkSwitcher,
  sections: [
    {
      title: "Assets",
      children: <PortfolioItemsChildren />,
      TotalValues: [
        {
          title: "Price",
          value: "$0.35",
          tooltip: <Image src={TooltipIcon} height="16" alt="tooltip icon" width="16" objectFit="contain" />,
          hideMobile: true,
        },
        {
          title: "Portfolio %",
          value: "50.23%",
          tooltip: <Image src={TooltipIcon} height="16" alt="tooltip icon" width="16" objectFit="contain" />,
          hideMobile: false,
        },
        {
          title: "Balance",
          value: "$40K",
          tooltip: <Image src={TooltipIcon} height="16" alt="tooltip icon" width="16" objectFit="contain" />,
          hideMobile: false,
        },
      ],
      NetworkIcons: <></>,
    },
    {
      title: "Rewards",
      children: <PortfolioItemsChildren />,
      TotalValues: [
        {
          title: "Price",
          value: "$0.35",
          tooltip: <Image src={TooltipIcon} height="16" alt="tooltip icon" width="16" objectFit="contain" />,
          hideMobile: true,
        },
        {
          title: "Portfolio %",
          value: "50.23%",
          tooltip: <Image src={TooltipIcon} height="16" alt="tooltip icon" width="16" objectFit="contain" />,
          hideMobile: false,
        },
        {
          title: "Balance",
          value: "$40K",
          tooltip: <Image src={TooltipIcon} height="16" alt="tooltip icon" width="16" objectFit="contain" />,
          hideMobile: false,
        },
      ],
      NetworkIcons: <></>,
    },
  ],
};
