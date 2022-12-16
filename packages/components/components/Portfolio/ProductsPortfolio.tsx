// react, external dep imports go first
import React from "react";

// aliased imports go second
import { useAccount } from "wagmi";
import { useSupportedContracts } from "@popcorn/components/hooks";

// relative imports got to lowest import block
// assets go always at the end of this block and can by convention start with `asset_`
import PortfolioItemsContainer from "./PortfolioItemsContainer";
import PortfolioSectionHeader from "./PortfolioSectionHeader";

type ProductsPortfolioProps = {
  selectedNetworks: any;
};

const ProductsPortfolio = ({ selectedNetworks }: ProductsPortfolioProps) => {
  const { address: account } = useAccount();
  const selectedContracts = useSupportedContracts(selectedNetworks);

  return (
    <div>
      <PortfolioSectionHeader sectionTitle="Assets" selectedContracts={selectedContracts}>
        {selectedContracts.map((token, i) => {
          return (
            <PortfolioItemsContainer
              index={i}
              alias={token.__alias}
              key={`${i}:${token.chainId}:${token.address}`}
              chainId={Number(token.chainId)}
              address={token.address}
              account={account}
            />
          );
        })}
      </PortfolioSectionHeader>
    </div>
  );
};

export default ProductsPortfolio;
