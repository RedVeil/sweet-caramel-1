import { ChainId } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import useThreeXData from "hooks/set/useThreeXData";
import useStakingPool from "hooks/staking/useStakingPool";
import { useDeployment } from "hooks/useDeployment";
import { useMemo } from "react";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";

export default function useThreeXNetworth(): {
  threeXHoldings: BigNumber;
  threeXStakingHoldings: BigNumber;
  threeXRedeemBatchHoldings: BigNumber;
  threeXStakingRewardsHoldings: BigNumber;
} {
  const { Ethereum } = ChainId;
  const ethereum = useDeployment(Ethereum);
  const { getHoldingValue, useHoldingValue, popPrice } = useCommonNetworthFunctions(ethereum, Ethereum);

  const { data: threeXStakingPool } = useStakingPool(ethereum.threeXStaking, Ethereum);
  const { data: threeXBatchData } = useThreeXData(Ethereum);
  const threeXStakingRewardsHoldings = useHoldingValue(threeXStakingPool?.earned, popPrice);

  const threeXHoldings = useMemo(() => {
    if (!threeXBatchData) return constants.Zero;
    const threeX = threeXBatchData?.tokens.find((token) => token.address === ethereum.threeX);
    return getHoldingValue(threeX?.balance?.add(threeX?.claimableBalance), threeX?.price);
  }, [threeXBatchData]);

  const threeXStakingHoldings = useMemo(() => {
    if (!threeXStakingPool || !threeXBatchData) return constants.Zero;
    const threeX = threeXBatchData?.tokens.find((token) => token.address === ethereum.threeX);
    return getHoldingValue(threeXStakingPool?.userStake, threeX?.price);
  }, [threeXStakingPool, threeXBatchData]);

  const threeXRedeemBatchHoldings = useMemo(() => {
    if (!threeXBatchData) return constants.Zero;
    const usdc = threeXBatchData?.tokens.find((token) => token.address === ethereum.usdc);
    return getHoldingValue(usdc?.claimableBalance, usdc?.price);
  }, [threeXBatchData]);

  return {
    threeXHoldings,
    threeXStakingHoldings,
    threeXRedeemBatchHoldings,
    threeXStakingRewardsHoldings,
  };
}
