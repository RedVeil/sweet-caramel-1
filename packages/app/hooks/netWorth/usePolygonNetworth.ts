import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";
import usePopLocker from "@popcorn/app/hooks/staking/usePopLocker";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import useTokenBalance from "@popcorn/app/hooks/tokens/useTokenBalance";
import useTokenPrices from "@popcorn/app/hooks/tokens/useTokenPrices";

export default function usePolygonNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { Polygon, Ethereum } = ChainId;
  const polygon = useDeployment(Polygon);
  const ethereum = useDeployment(Ethereum);

  const {
    useHoldingValue,
    popPrice,
    account,
    chainPopBalance: polygonPopBalance,
    chainEscrow: polygonEscrow,
  } = useCommonNetworthFunctions(polygon, Polygon);

  const { data: poylgonLpPriceData } = useTokenPrices([polygon.pop, polygon.popUsdcArrakisVault], Polygon); // in 1e18
  const polygonLpPrice = poylgonLpPriceData?.[polygon.popUsdcArrakisVault];
  const { data: polygonLpStakingPool } = useStakingPool(ethereum.popUsdcArrakisVaultStaking, Polygon);
  const { data: polygonLpBalance } = useTokenBalance(ethereum?.popUsdcArrakisVault, account, Polygon);

  // pop holdings
  const polygonPopHoldings = useHoldingValue(polygonPopBalance, popPrice);
  const polygonPopLpHoldings = useHoldingValue(polygonLpBalance, polygonLpPrice);
  const polygonPopLpStakingHoldings = useHoldingValue(polygonLpStakingPool?.userStake, polygonLpPrice);

  // pop staking holdings
  const { data: polygonPopStaking } = usePopLocker(polygon.popStaking, Polygon);
  const polygonPopStakingHoldings = useHoldingValue(polygonPopStaking?.userStake, popPrice);

  // escrow holdings
  const polygonEscrowHoldings = useHoldingValue(
    polygonEscrow?.totalClaimablePop?.add(polygonEscrow?.totalVestingPop),
    popPrice,
  );

  // rewards holdings
  const polygonPopStakingRewardsHoldings = useHoldingValue(polygonPopStaking?.earned, popPrice);
  const polygonLPStakingRewardsHoldings = useHoldingValue(polygonLpStakingPool?.earned, popPrice);

  const calculatePolygonHoldings = (): BigNumber => {
    return [
      polygonPopHoldings,
      polygonPopStakingHoldings,
      polygonEscrowHoldings,
      polygonPopStakingRewardsHoldings,
      polygonLPStakingRewardsHoldings,
      polygonPopLpHoldings,
      polygonPopLpStakingHoldings,
    ].reduce((total, num) => total.add(num));
  };

  return {
    total: calculatePolygonHoldings(),
    inWallet: polygonPopHoldings,
    deposit: polygonPopStakingHoldings,
    vesting: polygonEscrowHoldings,
  };
}
