import { ChainId, numberToBigNumber } from "@popcorn/utils";
import { StakingPool } from "@popcorn/utils/types";
import useStakingData from "./useStakingData";

export default function usePopStaking(stakingPool: StakingPool, ChainIds: ChainId[]) {
  const ethereumPopStaking = useStakingData(stakingPool, ChainIds[0]);
  const polygonPopStaking = useStakingData(stakingPool, ChainIds[1]);

  const popStakingPools = [ethereumPopStaking, polygonPopStaking];

  const combinedDeposited = popStakingPools.reduce((prev, pool) => prev.add(pool.deposited), numberToBigNumber(0, 18));

  const combinedTVL = popStakingPools.reduce((prev, pool) => prev.add(pool.tvl), numberToBigNumber(0, 18));

  const combinedEmissions = popStakingPools.reduce((prev, pool) => prev.add(pool.emissions), numberToBigNumber(0, 18));

  // const combinedVAPRSum = popStakingPools.reduce((prev, pool) => prev.add(pool.vAPR), numberToBigNumber(0, 18));

  // const combinedVAPRAvg = combinedVAPRSum.div(numberToBigNumber(popStakingPools.length, 18));
  return {
    tokenName: popStakingPools[0].tokenName,
    tokenIcon: popStakingPools[0].tokenIcon,
    combinedDeposited,
    combinedTVL,
    combinedEmissions,
    // combinedVAPRAvg
  };
}
