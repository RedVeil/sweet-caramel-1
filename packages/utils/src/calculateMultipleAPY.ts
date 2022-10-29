import { BigNumber } from "ethers/lib/ethers";
import { useStakingDataValues } from "../../app/hooks/portfolio/staking/useStakingData";
import { formatAndRoundBigNumber, numberToBigNumber } from "./formatBigNumber";

export const calculateMultipleAPY = (stakingPools: useStakingDataValues[], totalDeposited: BigNumber): BigNumber => {
  const vAPRPercentArray = stakingPools.map((pool) => {
    const currentVAPR = pool.vAPR;
    console.log(formatAndRoundBigNumber(pool.vAPR, 18));

    const percentMulByDeposited = currentVAPR.mul(pool?.deposited);
    return percentMulByDeposited.div(numberToBigNumber(100, 18));
  });

  const totalAPY = vAPRPercentArray.reduce((prev, next) => {
    return prev.add(next);
  }, numberToBigNumber(0, 18));

  return totalAPY.div(totalDeposited).mul(numberToBigNumber(100, 18));
};
