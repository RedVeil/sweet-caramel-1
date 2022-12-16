// react, external dep imports go first
import type { PropsWithChildren } from "react";
import React from "react";
import { useAccount } from "wagmi";

// aliased imports go second
import { ChainId } from "@popcorn/utils";
import { TotalBalanceOf } from "@popcorn/components/lib/Contract";
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";

// relative imports got to lowest import block
// assets go always at the end of this block and can by convention start with `asset_`
import PortfolioSection from "./PortfolioSection";
import NetworkIconList from "./NetworkIconList";

const PortfolioSectionHeader = ({
  children,
  selectedContracts,
  sectionTitle,
}: PropsWithChildren<{
  selectedContracts: any;
  sectionTitle: string;
}>) => {
  const { address: account } = useAccount();

  const props = {
    title: sectionTitle,
    TotalValues: [
      {
        title: "Price",
        value: "",
        tooltip: (
          <InfoIconWithTooltip
            classExtras=""
            id="price-products-tooltip"
            title="Total value locked (TVL)"
            content="Total value locked (TVL) is the amount of user funds deposited in popcorn products."
          />
        ),
        hideMobile: true,
      },
      {
        title: "Portfolio %",
        value: "",
        tooltip: (
          <InfoIconWithTooltip
            classExtras=""
            id="portfolio-products-tooltip"
            title="Total value locked (TVL)"
            content="Total value locked (TVL) is the amount of user funds deposited in popcorn products."
          />
        ),
        hideMobile: false,
      },
      {
        title: "Balance",
        value: <TotalBalanceOf account={account} selectedContracts={selectedContracts} />,
        tooltip: (
          <InfoIconWithTooltip
            classExtras=""
            id="balance-products-tooltip"
            title="Total value locked (TVL)"
            content="Total value locked (TVL) is the amount of user funds deposited in popcorn products."
          />
        ),
        hideMobile: false,
      },
    ],
  };

  return (
    <div>
      <PortfolioSection
        {...props}
        NetworkIcons={<NetworkIconList networks={[ChainId.Ethereum, ChainId.Polygon, ChainId.BNB, ChainId.Arbitrum]} />}
      >
        {children}
      </PortfolioSection>
    </div>
  );
};

export default PortfolioSectionHeader;
