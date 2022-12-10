import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioItem from "../components/PortfolioItem";

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
    "$0.35",
    "0.1234%",
    <>
      <p>$10K</p>
      <p className="text-tokenTextGray">10K POP</p>
    </>
  ]
};
