import React, { useEffect, useState } from "react";
import PortfolioSection from "../PortfolioSection";
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { useAccount } from "wagmi";
import { Pop } from "../../lib/types";
import { useNamedAccounts } from "../../lib/utils/hooks";
import PortfolioItemsContainer from "./PortfolioItemsContainer";
import { ChainId, networkLogos } from "@popcorn/utils";
import { BalanceOf } from "@popcorn/components/lib/Contract";

const ProductsPortfolio = ({ selectedNetworks }) => {
  console.log(selectedNetworks);

  // const { address: account } = useAccount();
  // const account = "0x32cb9fd13af7635cc90d0713a80188b366a28205";
  const account = "0x4f20cb7a1d567a54350a18dacb0cc803aebb4483";

  const contractsEth = useNamedAccounts("1", [
    "pop",
    "popStaking",
    "threeX",
    "threeXStaking",
    "butter",
    "butterStaking",
    "xenStaking",
    "popUsdcArrakisVaultStaking",
  ]);

  const contractsPoly = useNamedAccounts("137", [
    "pop",
    "popStaking",
    "popUsdcSushiLP",
    "popUsdcArrakisVault",
    "popUsdcArrakisVaultStaking",
    "xPop",
  ]);
  const contractsBnb = useNamedAccounts("56", ["pop", "xPop", "rewardsEscrow"]);

  const contractsArbitrum = useNamedAccounts("42161", ["pop", "xPop", "rewardsEscrow"]);

  const contractsOp = useNamedAccounts("10", ["pop", "popUsdcArrakisVault"]);
  const findNetwork = (chainId: Number) => {
    return selectedNetworks.includes(chainId);
  };
  const allContracts = [...contractsEth, ...contractsPoly, ...contractsBnb, ...contractsArbitrum].flatMap(
    (network) => network,
  ) as Pop.NamedAccountsMetadata[];
  const [selectedContracts, setSelectedContracts] = useState(allContracts);
  useEffect(() => {
    const filteredContracts = allContracts.filter((contract) => findNetwork(Number(contract.chainId)));
    setSelectedContracts(filteredContracts);
    // if (selectedNetworks.includes(0)) {
    //   setSelectedContracts(allContracts)
    // } else {
    //   const filteredContracts = allContracts.filter((contract) => findNetwork(Number(contract.chainId)))
    //   setSelectedContracts(filteredContracts)
    // }
  }, [selectedNetworks]);

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
  const NetworkIcons = (
    <div className="relative flex items-center">
      <div className="relative">
        <img src={networkLogos[1]} alt="network logo" className="w-6 h-6" />
      </div>
      <div className="relative -left-1">
        <img src={networkLogos[137]} alt="network logo" className="w-6 h-6" />
      </div>
      <div className="relative -left-2">
        <img src={networkLogos[56]} alt="network logo" className="w-6 h-6" />
      </div>
      <div className="relative -left-3">
        <img src={networkLogos[42161]} alt="network logo" className="w-6 h-6" />
      </div>
    </div>
  );
  return (
    <div>
      <PortfolioSection {...props} NetworkIcons={NetworkIcons}>
        {selectedContracts.map((token, i) => (
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
    </div>
  );
};

export default ProductsPortfolio;
