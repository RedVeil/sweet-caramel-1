import { ChainId, formatAndRoundBigNumber, numberToBigNumber } from "@popcorn/utils";
import usePopStaking from "hooks/portfolio/usePopStaking";
import usePopLocker from "hooks/staking/usePopLocker";
import { useDeployment } from "hooks/useDeployment";
import React from "react";
import PortfolioProductItem from "../PortfolioProductItem";

const PopStaking = () => {
  const { Ethereum, Polygon } = ChainId;
  const { popStaking } = useDeployment(Ethereum);
  const { data: popLocker, isValidating: popLockerIsValidating, error: popError } = usePopLocker(popStaking, Ethereum);
  const productData = usePopStaking(popLocker, [Ethereum, Polygon]);
  let productProps = {
    tokenIcon: ``,
    tokenName: ``,
    tokenStatusLabels: [
      {
        content: "$0",
        label: "Deposited",
        infoIconProps: {
          id: "products-deposited",
          title: "How we calculate the Deposited",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
      {
        content: `0%`,
        label: "vAPR",
        emissions: `0 POP`,
        infoIconProps: {
          id: "products-vapr",
          title: "How we calculate the vAPR",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
      {
        content: `$0`,
        label: "TVL",
        infoIconProps: {
          id: "products-tvl",
          title: "How we calculate the TVL",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
    ],
  };
  // combinedDeposited
  if (productData.combinedTVL > numberToBigNumber(0, 18)) {
    productProps.tokenIcon = productData.tokenIcon;
    productProps.tokenName = productData.tokenName;
    productProps.tokenStatusLabels[0].content = `$${formatAndRoundBigNumber(productData.combinedDeposited, 18)}`;

    productProps.tokenStatusLabels[1].emissions = `${formatAndRoundBigNumber(productData.combinedEmissions, 18)} POP`;

    productProps.tokenStatusLabels[2].content = `$${formatAndRoundBigNumber(productData.combinedTVL, 18)}`;
  }

  return (
    <>
      {/* {parseInt(deposited) > 0 && ( */}
      <div>
        <PortfolioProductItem {...productProps} />
      </div>
      {/* )} */}
    </>
  );
};

export default PopStaking;
