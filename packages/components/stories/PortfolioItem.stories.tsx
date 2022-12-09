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
  token: "0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4"
};

