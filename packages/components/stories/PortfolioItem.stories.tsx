import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioItem from "../components/Portfolio/PortfolioItem";
import EthIcon from "./assets/ethereum.svg";
import POPIcon from "./assets/POP.svg";

export default {
  title: "Components/PortfolioItem",
  component: PortfolioItem,
} as ComponentMeta<typeof PortfolioItem>;

const Template: ComponentStory<typeof PortfolioItem> = (args) => <PortfolioItem {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  tokenName: "POP",
  token: "Popcorn",
  contractIcon: EthIcon,
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
};
