import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import PortfolioSection from "../components/Portfolio/PortfolioSection";
import TooltipIcon from "../stories/assets/tooltip.svg";
import { BadgeVariant } from "../components/Badge";

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
};
