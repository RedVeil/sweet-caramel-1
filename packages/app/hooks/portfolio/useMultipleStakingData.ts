import { formatAndRoundBigNumber, numberToBigNumber } from "@popcorn/utils";
import { BigNumber, constants } from "ethers";
import useAssetValues from "hooks/useAssetValues";

export default function useMultipleStakingData(chainId, stakingPools) {
  let products = [];
  let tokenPrices;

  if (stakingPools.length > 0) {
    products = stakingPools.map((stakingPool) => {
      return stakingPool.tokenAddress;
    });
  }
  tokenPrices = useAssetValues(chainId, products);

  const getTokenPrice = (address) => {
    const currentPrice = tokenPrices.data[address];
    return currentPrice ? numberToBigNumber(currentPrice, 18) : numberToBigNumber(1, 18);
  };
  let totalTVL = "0";
  let totalDeposited = "0";
  let totalVAPR = "0";
  let totalEarned = "0";
  let totalContracts = "2";

  if (tokenPrices?.data !== undefined) {
    totalTVL = formatAndRoundBigNumber(
      stakingPools.reduce((prev, next) => {
        const currentTVL = next?.totalStake?.mul(getTokenPrice(next.tokenAddress)).div(constants.WeiPerEther);
        return prev.add(currentTVL);
      }, numberToBigNumber(0, 18)),
      18,
    );

    const totalDepositedBigNumber = stakingPools.reduce((prev: BigNumber, next) => {
      const currentDeposited = next?.userStake?.mul(getTokenPrice(next.tokenAddress));
      return prev.add(currentDeposited);
    }, numberToBigNumber(0, 18));

    totalDeposited = formatAndRoundBigNumber(totalDepositedBigNumber, 18);

    if (totalDeposited != "0") {
      const vAPRPercentArray = stakingPools.map((pool) => {
        const currentVAPR = pool?.apy.lt(constants.Zero) ? numberToBigNumber(0, 18) : pool.apy;
        console.log(formatAndRoundBigNumber(pool.apy, 18));

        const percentMulByDeposited = currentVAPR.mul(pool?.userStake?.mul(getTokenPrice(pool.tokenAddress)));
        return percentMulByDeposited.div(numberToBigNumber(100, 18));
      });

      const totalAPY = vAPRPercentArray.reduce((prev, next) => {
        return prev.add(next);
      }, numberToBigNumber(0, 18));

      totalVAPR = formatAndRoundBigNumber(totalAPY.div(totalDepositedBigNumber).mul(numberToBigNumber(100, 18)), 18);
    }

    totalEarned = formatAndRoundBigNumber(
      stakingPools.reduce((prev, next) => {
        const currentEarned = next.earned.mul(getTokenPrice(next.tokenAddress));
        return prev.add(currentEarned);
      }, numberToBigNumber(0, 18)),
      18,
    );

    totalContracts = stakingPools.filter(
      (pool) => pool.userStake.toString() != numberToBigNumber(0, 18).toString(),
    ).length;
  }

  return { totalDeposited, totalTVL, totalVAPR, totalEarned, totalContracts };
}
