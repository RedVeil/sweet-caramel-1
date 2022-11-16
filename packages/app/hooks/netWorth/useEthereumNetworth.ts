import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import useButterNetworth from "./useButterNetworth";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";
import useThreeXNetworth from "./useThreeXNetworth";
import { useGetUserEscrows } from "@popcorn/app/hooks/useGetUserEscrows";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import useTokenBalance from "@popcorn/app/hooks/tokens/useTokenBalance";
import useTokenPrices from "@popcorn/app/hooks/tokens/useTokenPrices";
import usePopLocker from "@popcorn/app/hooks/staking/usePopLocker";

export default function useEthereumNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { Ethereum, Polygon } = ChainId;
  const ethereum = useDeployment(Ethereum);
  const polygon = useDeployment(Polygon);

  const { threeXHoldings, threeXStakingHoldings, threeXRedeemBatchHoldings, threeXStakingRewardsHoldings } =
    useThreeXNetworth();

  const { butterHoldings, butterStakingHoldings, butterRedeemBatchHoldings, butterStakingRewardsHoldings } =
    useButterNetworth();

  const {
    useHoldingValue,
    popPrice,
    account,
    chainEscrow: mainnetEscrow,
  } = useCommonNetworthFunctions(ethereum, Ethereum);

  const { data: mainnetLpStakingPool } = useStakingPool(ethereum.popUsdcArrakisVaultStaking, Ethereum);
  const { data: mainnetVaultEscrow } = useGetUserEscrows(ethereum.vaultsRewardsEscrow, account, Ethereum);
  const { data: mainnetPopStaking } = usePopLocker(ethereum.popStaking, Ethereum);
  const { data: mainnetPopBalance } = useTokenBalance(ethereum?.pop, account, Ethereum);
  const { data: mainnetLpBalance } = useTokenBalance(polygon?.popUsdcArrakisVault, account, Ethereum);
  const { data: mainnetPriceData } = useTokenPrices([ethereum.pop, ethereum.popUsdcArrakisVault], Ethereum); // in 1e18
  const mainnetLpPrice = mainnetPriceData?.[ethereum.popUsdcArrakisVault];

  const mainnetPopLpHoldings = useHoldingValue(mainnetLpBalance, mainnetLpPrice);
  const mainnetPopHoldings = useHoldingValue(mainnetPopBalance, popPrice);
  const mainnetPopStakingHoldings = useHoldingValue(mainnetPopStaking?.userStake, popPrice);
  const mainnetPopStakingRewardsHoldings = useHoldingValue(mainnetPopStaking?.earned, popPrice);
  const mainnetLPStakingRewardsHoldings = useHoldingValue(mainnetLpStakingPool?.earned, popPrice);
  const mainnetPopLpStakingHoldings = useHoldingValue(mainnetLpStakingPool?.userStake, mainnetLpPrice);
  const mainnetEscrowHoldings = useHoldingValue(
    BigNumber.from("0")
      .add(mainnetEscrow?.totalClaimablePop || "0")
      .add(mainnetEscrow?.totalVestingPop || "0")
      .add(mainnetVaultEscrow?.totalClaimablePop || "0")
      .add(mainnetVaultEscrow?.totalVestingPop || "0"),
    popPrice,
  );

  const totalDeposits = () => {
    return [
      threeXHoldings,
      threeXStakingHoldings,
      threeXRedeemBatchHoldings,
      butterStakingHoldings,
      butterHoldings,
      butterRedeemBatchHoldings,
      mainnetPopStakingHoldings,
    ].reduce((total, num) => total.add(num));
  };

  const calculateEthereumHoldings = (): BigNumber => {
    return [
      mainnetPopHoldings,
      mainnetPopStakingHoldings,
      butterHoldings,
      threeXHoldings,
      butterStakingHoldings,
      threeXStakingHoldings,
      mainnetEscrowHoldings,
      butterRedeemBatchHoldings,
      threeXRedeemBatchHoldings,
      mainnetPopStakingRewardsHoldings,
      butterStakingRewardsHoldings,
      threeXStakingRewardsHoldings,
      mainnetLPStakingRewardsHoldings,
      mainnetPopLpHoldings,
      mainnetPopLpStakingHoldings,
    ].reduce((total, num) => total.add(num));
  };

  return {
    total: calculateEthereumHoldings(),
    inWallet: mainnetPopHoldings,
    deposit: totalDeposits(),
    vesting: mainnetEscrowHoldings,
  };
}
