import useArrakisStaking from "hooks/portfolio/staking/useArrakisStaking";
import useButterStaking from "hooks/portfolio/staking/useButterStaking";
import usePopStaking from "hooks/portfolio/staking/usePopStaking";
import useThreeXStaking from "hooks/portfolio/staking/useThreeXStaking";
import React from "react";
import PortfolioProductItem from "../PortfolioProductItem";

const StakingItems = () => {
  const popProductProps = usePopStaking();
  const butterProps = useButterStaking();
  const threeXProps = useThreeXStaking();
  const arrakisProps = useArrakisStaking();

  return (
    <>
      {/* {parseInt(deposited) > 0 && ( */}
      <div>
        <PortfolioProductItem {...popProductProps} />
        <PortfolioProductItem {...butterProps} />
        <PortfolioProductItem {...threeXProps} />
        <PortfolioProductItem {...arrakisProps} />
      </div>
      {/* )} */}
    </>
  );
};

export default StakingItems;
