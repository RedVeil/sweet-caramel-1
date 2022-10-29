import { useStakingDataValues } from "hooks/portfolio/staking/useStakingData";
import React from "react";
import PortfolioProductItem from "../PortfolioProductItem";

interface StakingItemsProps {
  popProductProps: useStakingDataValues;
  butterProps: useStakingDataValues;
  threeXProps: useStakingDataValues;
  arrakisProps: useStakingDataValues;
  popHasValue: boolean;
  butterHasValue: boolean;
  threeXHasValue: boolean;
  arrakisHasValue: boolean;
}

const StakingItems = (props) => {
  return (
    <>
      {/* {parseInt(deposited) > 0 && ( */}
      <div>
        {props.popHasValue && <PortfolioProductItem {...props.popProductProps} />}
        {props.butterHasValue && <PortfolioProductItem {...props.butterProps} />}
        {props.threeXHasValue && <PortfolioProductItem {...props.threeXProps} />}
        {props.arrakisHasValue && <PortfolioProductItem {...props.arrakisProps} />}
      </div>
      {/* )} */}
    </>
  );
};

export default StakingItems;
