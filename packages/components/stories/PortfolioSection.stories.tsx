import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioSection from "../components/PortfolioSection";
import TooltipIcon from "../stories/assets/tooltip.svg"

export default {
  title: "Components/PortfolioSection",
  component: PortfolioSection,
} as ComponentMeta<typeof PortfolioSection>;

const Template: ComponentStory<typeof PortfolioSection> = (args) => <PortfolioSection {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  title: "Assets",
  PortfolioItems: [
    {
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
      ],
    },
    {
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
      ],
    },
    {
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
      ],
    }
  ],
  TotalValues: [
    {
      title: "Price",
      value: "$0.35",
      tooltip: <img
        src={TooltipIcon}
        alt="tooltip"
        className={`cursor-pointer w-4 h-4`}
      />
    },
    {
      title: "Portfolio %",
      value: "50.23%",
      tooltip: <img
        src={TooltipIcon}
        alt="tooltip"
        className={`cursor-pointer w-4 h-4`}
      />
    },
    {
      title: "Balance",
      value: "$40K",
      tooltip: <img
        src={TooltipIcon}
        alt="tooltip"
        className={`cursor-pointer w-4 h-4`}
      />
    }
  ]
}; 
