// react, external dep imports go first
import React from "react";

// aliased imports go second
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { useSupportedContracts } from "@popcorn/components/hooks";
import { ChainId } from "@popcorn/utils";

// relative imports got to lowest import block
// assets go always at the end of this block and can by convention start with `asset_`
import PortfolioItemsContainer from "./PortfolioItemsContainer";
import PortfolioSection from "./PortfolioSection";
import NetworkIconList from "./NetworkIconList";

const ProductsPortfolio = ({ selectedNetworks }) => {
  // const { address: account } = useAccount();
  // const account = "0x32cb9fd13af7635cc90d0713a80188b366a28205";
  const account = "0x4f20cb7a1d567a54350a18dacb0cc803aebb4483";
  const selectedContracts = useSupportedContracts(selectedNetworks);

  const props = {
    title: "Assets",
    TotalValues: [
      {
        title: "Price",
        value: "$0.35",
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
        value: "50.23%",
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
        value: "$40K",
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
        {selectedContracts.map((token, i) => (
          <PortfolioItemsContainer
            index={i}
            alias={token.__alias}
            key={`${i}:${token.chainId}:${token.address}`}
            chainId={Number(token.chainId)}
            address={token.address}
            account={account}
          />
        ))}
      </PortfolioSection>
    </div>
  );
};

export default ProductsPortfolio;
