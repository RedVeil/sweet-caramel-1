import { ChainId } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import useButterBatchData from "@popcorn/app/hooks/set/useButterBatchData";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useMemo } from "react";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";

export default function useButterNetworth(): {
  butterHoldings: BigNumber;
  butterStakingHoldings: BigNumber;
  butterRedeemBatchHoldings: BigNumber;
  butterStakingRewardsHoldings: BigNumber;
} {
  const { Ethereum } = ChainId;
  const ethereum = useDeployment(Ethereum);
  const { data: butterStakingPool } = useStakingPool(ethereum.butterStaking, Ethereum);
  const { data: butterBatchData } = useButterBatchData(Ethereum);
  const { getHoldingValue, useHoldingValue, popPrice } = useCommonNetworthFunctions(ethereum, Ethereum);

  const butterStakingRewardsHoldings = useHoldingValue(butterStakingPool?.earned, popPrice);

  const butterHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === ethereum.butter);
    return getHoldingValue(butter?.balance?.add(butter?.claimableBalance), butter?.price);
  }, [butterBatchData]);

  const butterStakingHoldings = useMemo(() => {
    if (!butterStakingPool || !butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === ethereum.butter);
    return getHoldingValue(butterStakingPool?.userStake, butter?.price);
  }, [butterStakingPool, butterBatchData]);

  const butterRedeemBatchHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const threeCrv = butterBatchData?.tokens.find((token) => token.address === ethereum.threeCrv);
    return getHoldingValue(threeCrv?.claimableBalance, threeCrv?.price);
  }, [butterBatchData]);

  return {
    butterHoldings,
    butterStakingHoldings,
    butterRedeemBatchHoldings,
    butterStakingRewardsHoldings,
  };
}
