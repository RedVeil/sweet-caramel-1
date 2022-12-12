import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioHero from "../components/PortfolioHero";
import EthIcon from "./assets/ethereum.svg";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export default {
  title: "Components/PortfolioHero",
  component: PortfolioHero,
} as ComponentMeta<typeof PortfolioHero>;

const Template: ComponentStory<typeof PortfolioHero> = (args) => <PortfolioHero {...args} />;

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
    <button className="w-full py-3 px-5 flex flex-row items-center justify-between space-x-1 rounded-4xl border border-gray-300 bg-white mt-8">
      <div className="flex items-center">All Networks</div>
      <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
    </button>
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  title: "Assets",
  NetworkSwitcher,
};
