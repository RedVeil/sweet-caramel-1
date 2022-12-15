import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioItem from "../components/Portfolio/PortfolioItem";

export default {
  title: "Components/PortfolioItem",
  component: PortfolioItem,
} as ComponentMeta<typeof PortfolioItem>;

const Template: ComponentStory<typeof PortfolioItem> = (args) => <PortfolioItem {...args} />;

export const Primary = Template.bind({});
Primary.args = {
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
};
