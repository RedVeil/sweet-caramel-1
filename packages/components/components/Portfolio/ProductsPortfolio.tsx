// react, external dep imports go first
import type { Pop } from "packages/components/lib/types";
import React, { useMemo } from "react";

// aliased imports go second
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { useAccount } from "wagmi";
import { ChainId, networkLogos } from "@popcorn/utils";
import { TotalBalanceOf } from "@popcorn/components/lib/Contract";
import { useSupportedContracts } from "@popcorn/components/hooks";

// relative imports got to lowest import block
// assets go always at the end of this block and can by convention start with `asset_`
import PortfolioItemsContainer from "./PortfolioItemsContainer";
import PortfolioSection from "./PortfolioSection";
import NetworkIconList from "./NetworkIconList";

type ProductsPortfolioProps = {
  selectedNetworks: any;
  /** Filter render elements. Used to filter reward only contracts */
  filterRenderItems?: (element: JSX.Element, contracts: Pop.NamedAccountsMetadata) => JSX.Element;
  title?: string;
};

const ProductsPortfolio = ({
  selectedNetworks,
  // TODO: add a shared `noOp` helper
  filterRenderItems = (item) => item,
  title = "Assets",
}: ProductsPortfolioProps) => {
  // const { address: account } = useAccount();
  // const account = "0x32cb9fd13af7635cc90d0713a80188b366a28205";
  const account = "0x4f20cb7a1d567a54350a18dacb0cc803aebb4483";
  const selectedContracts = useSupportedContracts(selectedNetworks);

  const props = {
    title,
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

  const memoizedElements = useMemo(() => {
    return selectedContracts.map((token, i) => {
      return filterRenderItems(
        <PortfolioItemsContainer
          index={i}
          alias={token.__alias}
          key={`${i}:${token.chainId}:${token.address}`}
          chainId={Number(token.chainId)}
          address={token.address}
          account={account}
        />,
        token,
      );
    });
    // instead to shallow-evaluate the whole object we consider it's length
  }, [selectedContracts.length]);

  return (
    <div>
      <PortfolioSection
        {...props}
        NetworkIcons={<NetworkIconList networks={[ChainId.Ethereum, ChainId.Polygon, ChainId.BNB, ChainId.Arbitrum]} />}
      >
        {memoizedElements}
      </PortfolioSection>
    </div>
  );
};

export default ProductsPortfolio;
