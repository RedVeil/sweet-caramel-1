import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import InfoCard from "../components/SweetVaults/InfoCard";
import ETHIcon from "./assets/ethereum.svg";

export default {
  title: "Components/InfoCard",
  component: InfoCard,
} as ComponentMeta<typeof InfoCard>;

const Template: ComponentStory<typeof InfoCard> = (args) => <InfoCard {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  title: "USDT",
  tokenImage: ETHIcon,
  infoList: [
    { infoItem: <span> USDT is a USD-pegged stablecoin-backed 1:1 with the dollar.</span> },
    { infoItem: <span> Collateral: Cash and cash equivalents. </span> },
    {
      infoItem: (
        <span>
          {" "}
          Collateral Ratio: ~100%{" "}
          <a href="" className="text-customPurple">
            (source)
          </a>{" "}
        </span>
      ),
    },
    {
      infoItem: (
        <span>
          {" "}
          Audits:{" "}
          <a href="" className="text-customPurple">
            Reports and reserves
          </a>{" "}
        </span>
      ),
    },
    { infoItem: <span> Founders: Aaron MacGregor (CEO), Craig Sellars, Reeve Collins, and Brock Pierce. </span> },
    {
      infoItem: (
        <span>
          {" "}
          Disclaimer: Not all of Tether’s reserves are liquid as indicated by the{" "}
          <a href="" className="text-customPurple">
            reserve breakdown
          </a>{" "}
          and given significant redemption demand, this may affect USDT’s ability to maintain its USD peg.
        </span>
      ),
    },
  ],

  strategies: [
    {
      title: "Aave Optimizer",
      content:
        "Deposits USDT into AAVE to earn stkAAVE. Once stkAAVE unlocks it is then harvested and sold for more USDT which is deposited back into the strategy.",
    },
    {
      title: "Stargate Finance Optimizer",
      content: (
        <span>
          {" "}
          Deposit USDT into{" "}
          <a href="" className="text-customPurple">
            {" "}
            Stargate Finance
          </a>{" "}
          to earn STG. Earned tokens are harvested and sold for more USDT which is deposited back into the strategy.
        </span>
      ),
    },
    {
      title: "Idle Finance Optimizer",
      content: (
        <span>
          {" "}
          Deposits USDT int{" "}
          <a href="" className="text-customPurple">
            {" "}
            Idle Finance
          </a>{" "}
          to earn IDLE and COMP. Earned tokens are harvested and sold for more USDT which is deposited back into the
          strategy.
        </span>
      ),
    },
  ],
};
