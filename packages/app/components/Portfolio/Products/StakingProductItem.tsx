import { ChainId } from "@popcorn/utils";
import { StakingPool } from "@popcorn/utils/types";
import useStakingData from "hooks/portfolio/useStakingData";
import React from "react";
import PortfolioProductItem from "../PortfolioProductItem";

interface StakingProductItemProps {
  stakingPool: StakingPool;
  ChainId: ChainId;
}
const StakingProductItem: React.FC<StakingProductItemProps> = ({ stakingPool, ChainId }) => {
  const { productProps, deposited } = useStakingData(stakingPool, ChainId);

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
