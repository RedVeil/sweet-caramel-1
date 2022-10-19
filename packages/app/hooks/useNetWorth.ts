import { ChainId } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import { parseEther } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import useButterBatchData from "./set/useButterBatchData";
import useThreeXData from "./set/useThreeXData";
import usePopLocker from "./staking/usePopLocker";
import useStakingPool from "./staking/useStakingPool";
import useTokenBalance from "./tokens/useTokenBalance";
import { useDeployment } from "./useDeployment";
import useGetPopTokenPriceInUSD from "./useGetPopTokenPriceInUSD";
import { useGetUserEscrows } from "./useGetUserEscrows";
import useWeb3 from "./useWeb3";

function getHoldingValue(tokenAmount: BigNumber, tokenPrice: BigNumber): BigNumber {
  tokenAmount = tokenAmount?.gt(constants.Zero) ? tokenAmount : constants.Zero;
  return tokenAmount.eq(constants.Zero) || tokenPrice?.eq(constants.Zero)
    ? constants.Zero
    : tokenAmount?.mul(tokenPrice ? tokenPrice : constants.Zero).div(constants.WeiPerEther) || constants.Zero;
}

export default function useNetWorth(): { [key: string | keyof ChainId]: BigNumber } {
  const { account } = useWeb3();
  const { Ethereum, Polygon, BNB, Arbitrum } = ChainId;
  const useHoldingValue = useCallback(getHoldingValue, []);

  const ethereum = useDeployment(Ethereum);
  const polygon = useDeployment(Polygon);
  const bnb = useDeployment(BNB);
  const arbitrum = useDeployment(Arbitrum);

  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const { data: mainnetPopStaking } = usePopLocker(ethereum.popStaking, Ethereum);
  const { data: polygonPopStaking } = usePopLocker(polygon.popStaking, Polygon);
  const { data: butterStakingPool } = useStakingPool(ethereum.butterStaking, Ethereum);
  const { data: butterBatchData } = useButterBatchData(Ethereum);
  const { data: threeXStakingPool } = useStakingPool(ethereum.threeXStaking, Ethereum);
  const { data: threeXBatchData } = useThreeXData(Ethereum);
  const { data: polygonPopBalance } = useTokenBalance(polygon?.pop, account, Polygon);
  const { data: mainnetPopBalance } = useTokenBalance(ethereum?.pop, account, Ethereum);
  const { data: bnbPopBalance } = useTokenBalance(bnb.pop, account, BNB);
  const { data: arbitrumPopBalance } = useTokenBalance(arbitrum.pop, account, Arbitrum);
  const { data: mainnetEscrow } = useGetUserEscrows(ethereum.rewardsEscrow, account, Ethereum);
  const { data: polygonEscrow } = useGetUserEscrows(polygon.rewardsEscrow, account, Polygon);
  const { data: bnbEscrow } = useGetUserEscrows(bnb.rewardsEscrow, account, BNB);
  const { data: arbitrumEscrow } = useGetUserEscrows(arbitrum.rewardsEscrow, account, Arbitrum);

  // todo: add popUsdc staking pools

  const { data: mainnetVaultEscrow } = useGetUserEscrows(ethereum.vaultsRewardsEscrow, account, Ethereum);

  // // raise popPrice by 1e12
  const raisedPopPrice = useMemo(() => (popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero), [popPrice]);

  const mainnetPopHoldings = useHoldingValue(mainnetPopBalance, raisedPopPrice);
  const polygonPopHoldings = useHoldingValue(polygonPopBalance, raisedPopPrice);
  const bnbPopHoldings = useHoldingValue(bnbPopBalance, raisedPopPrice);
  const arbitrumPopHoldings = useHoldingValue(arbitrumPopBalance, raisedPopPrice);
  const mainnetPopStakingHoldings = useHoldingValue(mainnetPopStaking?.userStake, raisedPopPrice);
  const polygonPopStakingHoldings = useHoldingValue(polygonPopStaking?.userStake, raisedPopPrice);

  const polygonEscrowHoldings = useHoldingValue(
    polygonEscrow?.totalClaimablePop?.add(polygonEscrow?.totalVestingPop),
    raisedPopPrice,
  );
  const bnbEscrowHoldings = useHoldingValue(
    bnbEscrow?.totalClaimablePop?.add(bnbEscrow?.totalVestingPop),
    raisedPopPrice,
  );
  const arbitrumEscrowHoldings = useHoldingValue(
    arbitrumEscrow?.totalClaimablePop?.add(arbitrumEscrow?.totalVestingPop),
    raisedPopPrice,
  );
  const mainnetEscrowHoldings = useHoldingValue(
    BigNumber.from("0")
      .add(mainnetEscrow?.totalClaimablePop || "0")
      .add(mainnetEscrow?.totalVestingPop || "0")
      .add(mainnetVaultEscrow?.totalClaimablePop || "0")
      .add(mainnetVaultEscrow?.totalVestingPop || "0"),
    raisedPopPrice,
  );

  const butterHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === ethereum.butter);
    return getHoldingValue(butter?.balance?.add(butter?.claimableBalance), butter?.price);
  }, [butterBatchData]);
  const threeXHoldings = useMemo(() => {
    if (!threeXBatchData) return constants.Zero;
    const threeX = threeXBatchData?.tokens.find((token) => token.address === ethereum.threeX);
    return getHoldingValue(threeX?.balance?.add(threeX?.claimableBalance), threeX?.price);
  }, [threeXBatchData]);
  const butterStakingHoldings = useMemo(() => {
    if (!butterStakingPool || !butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === ethereum.butter);
    return getHoldingValue(butterStakingPool?.userStake, butter?.price);
  }, [butterStakingPool, butterBatchData]);
  const threeXStakingHoldings = useMemo(() => {
    if (!threeXStakingPool || !threeXBatchData) return constants.Zero;
    const threeX = threeXBatchData?.tokens.find((token) => token.address === ethereum.threeX);
    return getHoldingValue(threeXStakingPool?.userStake, threeX?.price);
  }, [threeXStakingPool, threeXBatchData]);
  const butterRedeemBatchHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const threeCrv = butterBatchData?.tokens.find((token) => token.address === ethereum.threeCrv);
    return getHoldingValue(threeCrv?.claimableBalance, threeCrv?.price);
  }, [butterBatchData]);
  const threeXRedeemBatchHoldings = useMemo(() => {
    if (!threeXBatchData) return constants.Zero;
    const usdc = threeXBatchData?.tokens.find((token) => token.address === ethereum.usdc);
    return getHoldingValue(usdc?.claimableBalance, usdc?.price);
  }, [threeXBatchData]);

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
    ].reduce((total, num) => total.add(num));
  };

  const calculatePolygonHoldings = (): BigNumber => {
    return [polygonPopHoldings, polygonPopStakingHoldings, polygonEscrowHoldings].reduce((total, num) =>
      total.add(num),
    );
  };

  const calculateArbitrumHoldings = (): BigNumber => {
    return [arbitrumPopHoldings, arbitrumEscrowHoldings].reduce((total, num) => total.add(num));
  };

  const calculateBnbHoldings = (): BigNumber => {
    return [bnbPopHoldings, bnbEscrowHoldings].reduce((total, num) => total.add(num));
  };

  const calculateTotalHoldings = (): BigNumber => {
    return [
      mainnetPopHoldings,
      polygonPopHoldings,
      bnbPopHoldings,
      arbitrumPopHoldings,
      mainnetPopStakingHoldings,
      polygonPopStakingHoldings,
      butterHoldings,
      threeXHoldings,
      butterStakingHoldings,
      threeXStakingHoldings,
      mainnetEscrowHoldings,
      polygonEscrowHoldings,
      bnbEscrowHoldings,
      arbitrumEscrowHoldings,
      butterRedeemBatchHoldings,
      threeXRedeemBatchHoldings,
    ].reduce((total, num) => total.add(num));
  };

  return {
    [ChainId.Ethereum]: calculateEthereumHoldings(),
    [ChainId.Polygon]: calculatePolygonHoldings(),
    [ChainId.BNB]: calculateBnbHoldings(),
    [ChainId.Arbitrum]: calculateArbitrumHoldings(),
    totalNetWorth: calculateTotalHoldings(),
  };
}
