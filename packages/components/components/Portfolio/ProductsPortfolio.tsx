import React, { useEffect, useState } from "react";
import PortfolioSection from "./PortfolioSection";
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { useAccount } from "wagmi";
import PortfolioItemsContainer from "./PortfolioItemsContainer";
import { ChainId, networkLogos } from "@popcorn/utils";
import { TotalBalanceOf } from "@popcorn/components/lib/Contract";
import { useSupportedContracts } from "@popcorn/components/hooks";
import { useNetworth } from "@popcorn/components/context/Networth";
import { Pop } from "../../lib/types";
import Image from "next/image";

interface ProductsPortfolioProps {
  selectedNetworks: ChainId[];
  filterBy?: string;
}
const ProductsPortfolio = ({ selectedNetworks, filterBy }: ProductsPortfolioProps) => {
  const { address: account } = useAccount();
  const selectedContracts = useSupportedContracts(selectedNetworks);
  const { state: _state } = useNetworth();
  const [filteredContracts, setFilteredContracts] = useState<Pop.NamedAccountsMetadata[]>(selectedContracts);

  useEffect(() => {
    if (!!filterBy) {
      switch (filterBy) {
        case "LOWESTHOLDING":
          filterByLowestHolding();
          break;
        case "HIGHESTHOLDING":
          filterByHighestHolding();
          break;

        default:
          break;
      }
    }
  }, [filterBy]);

  const _filteredContracts = () =>
    selectedContracts.sort((prev, current) => {
      let prevContract = _state["total"][prev.address]?.value;
      let currentContract = _state["total"][current.address]?.value;
      if (prevContract && currentContract) {
        return prevContract.gte(currentContract) ? 0 : -1;
      } else return -1;
    });

  const filterByLowestHolding = () => {
    // TODO: this should filter the contracts by lowest holding
    // if ((selectedContracts?.length > 0) && (_state["total"])) {
    //   setFilteredContracts(_filteredContracts())
    // }
  };

  const filterByHighestHolding = () => {
    // TODO: this should filter the contracts by highest holding
    // if ((selectedContracts?.length > 0) && (_state["total"])) {
    //   setFilteredContracts(_filteredContracts().reverse)
    // }
  };
  const props = {
    title: "Assets",

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
  const NetworkIcons = (
    <div className="relative flex items-center">
      <div className="relative">
        <Image src={networkLogos[1]} height="24" alt="network logo" width="24" objectFit="contain" />
      </div>
      <div className="relative -left-1">
        <Image src={networkLogos[137]} height="24" alt="network logo" width="24" objectFit="contain" />
      </div>
      <div className="relative -left-2">
        <Image src={networkLogos[56]} height="24" alt="network logo" width="24" objectFit="contain" />
      </div>
      <div className="relative -left-3">
        <Image src={networkLogos[42161]} height="24" alt="network logo" width="24" objectFit="contain" />
      </div>
    </div>
  );
  return (
    <PortfolioSection {...props} NetworkIcons={NetworkIcons}>
      {filteredContracts.map((token, i) => (
        <PortfolioItemsContainer
          index={i}
          alias={token.__alias}
          key={`${i}:${token.chainId}:${token.address}`}
          chainId={Number(token.chainId) as unknown as ChainId}
          address={token.address}
          account={account}
        />
      ))}
    </PortfolioSection>
  );
};

export default ProductsPortfolio;
