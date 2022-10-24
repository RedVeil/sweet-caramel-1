import { StakingPool } from "@popcorn/utils/types";
import useStakingData from "hooks/portfolio/useStakingData";
import React from "react";
import PortfolioProductItem from "../PortfolioProductItem";

interface StakingProductItemProps {
  stakingPool: StakingPool;
}
const StakingProductItem: React.FC<StakingProductItemProps> = ({ stakingPool }) => {
  const { productProps, deposited } = useStakingData(stakingPool);

  return (
    <>
      {parseInt(deposited) > 0 && (
        <div>
          <PortfolioProductItem {...productProps} />
        </div>
      )}
    </>
  );
};

export default StakingProductItem;
