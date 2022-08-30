import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ERC20__factory } from "@popcorn/hardhat/typechain";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import { parseEther } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import useButterBatchData from "./set/useButterBatchData";
import useThreeXData from "./set/useThreeXData";
import usePopLocker from "./staking/usePopLocker";
import useStakingPool from "./staking/useStakingPool";
import useTokenBalance from "./tokens/useTokenBalance";
import useGetButterTokenPriceInUSD from "./useGetButterTokenPriceInUSD";
import useGetPopTokenPriceInUSD from "./useGetPopTokenPriceInUSD";
import useGetThreeXTokenPrice from "./useGetTreeXTokenPrice";
import useGetUserEscrows from "./useGetUserEscrows";
import useWeb3 from "./useWeb3";

function getHoldingValue(tokenAmount: BigNumber, tokenPrice: BigNumber): BigNumber {
  tokenAmount = tokenAmount ? tokenAmount : constants.Zero;
  return tokenAmount.eq(constants.Zero) || tokenPrice.eq(constants.Zero)
    ? constants.Zero
    : tokenAmount.mul(tokenPrice).div(constants.WeiPerEther);
}

export default function useNetWorth(): BigNumber {
  const { account } = useWeb3();

  const { pop, butter, threeX, butterStaking, threeXStaking, popStaking } = useMemo(
    () => getChainRelevantContracts(ChainId.Ethereum),
    [],
  );
  const { pop: polygonPopAddress, popStaking: polygonPopStakingAddress } = useMemo(
    () => getChainRelevantContracts(ChainId.Polygon),
    [],
  );
  const { pop: bnbPopAddress } = useMemo(
    () => getChainRelevantContracts(ChainId.BNB),
    [],
  );
  const { pop: arbitrumPopAddress } = useMemo(
    () => getChainRelevantContracts(ChainId.Arbitrum),
    [],
  );

  const erc20 = useCallback((address: string, rpcProvider) => ERC20__factory.connect(address, rpcProvider), []);

  const { data: mainnetPopStaking } = usePopLocker(popStaking);
  const { data: polygonPopStaking } = usePopLocker(polygonPopStakingAddress);
  const { data: butterStakingPool } = useStakingPool(butterStaking);
  const { data: threeXStakingPool } = useStakingPool(threeXStaking);
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const { data: butterBatchData } = useButterBatchData(PRC_PROVIDERS[ChainId.Ethereum]);
  const { data: threeXBatchData } = useThreeXData(PRC_PROVIDERS[ChainId.Ethereum]);
  const { data: mainnetPopBalance } = useTokenBalance(erc20(pop, PRC_PROVIDERS[ChainId.Ethereum]), account);
  const { data: polygonPopBalance } = useTokenBalance(erc20(polygonPopAddress, PRC_PROVIDERS[ChainId.Polygon]), account);
  const { data: bnbPopBalance } = useTokenBalance(erc20(bnbPopAddress, PRC_PROVIDERS[ChainId.BNB]), account);
  const { data: arbitrumPopBalance } = useTokenBalance(erc20(arbitrumPopAddress, PRC_PROVIDERS[ChainId.Arbitrum]), account);
  const { data: mainnetEscrow } = useGetUserEscrows(ChainId.Ethereum, PRC_PROVIDERS[ChainId.Ethereum])
  const { data: polygonEscrow } = useGetUserEscrows(ChainId.Polygon, PRC_PROVIDERS[ChainId.Polygon])
  const { data: bnbEscrow } = useGetUserEscrows(ChainId.BNB, PRC_PROVIDERS[ChainId.BNB])
  const { data: arbitrumEscrow } = useGetUserEscrows(ChainId.Arbitrum, PRC_PROVIDERS[ChainId.Arbitrum])

  // // raise popPrice by 1e12
  const raisedPopPrice = useMemo(() => (popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero), [popPrice]);

  const mainnetPopHoldings = useMemo(
    () => (mainnetPopBalance ? getHoldingValue(mainnetPopBalance, raisedPopPrice) : constants.Zero),
    [mainnetPopBalance],
  );
  const polygonPopHoldings = useMemo(
    () => (polygonPopBalance ? getHoldingValue(polygonPopBalance, raisedPopPrice) : constants.Zero),
    [polygonPopBalance],
  );
  const bnbPopHoldings = useMemo(
    () => (bnbPopBalance ? getHoldingValue(bnbPopBalance, raisedPopPrice) : constants.Zero),
    [bnbPopBalance],
  );
  const arbitrumPopHoldings = useMemo(
    () => (arbitrumPopBalance ? getHoldingValue(arbitrumPopBalance, raisedPopPrice) : constants.Zero),
    [arbitrumPopBalance],
  );
  const mainnetPopStakingHoldings = useMemo(
    () => (mainnetPopStaking ? getHoldingValue(mainnetPopStaking.userStake, raisedPopPrice) : constants.Zero),
    [mainnetPopStaking],
  );
  const polygonPopStakingHoldings = useMemo(
    () => (polygonPopStaking ? getHoldingValue(polygonPopStaking.userStake, raisedPopPrice) : constants.Zero),
    [polygonPopStaking],
  );
  const butterHoldings = useMemo(
    () => (butterBatchData ? getHoldingValue(butterBatchData?.tokens?.butter?.balance?.add(butterBatchData?.tokens?.butter?.claimableBalance), butterBatchData?.tokens?.butter?.price) : constants.Zero),
    [butterBatchData],
  );
  const threeXHoldings = useMemo(
    () => (threeXBatchData ? getHoldingValue(threeXBatchData?.tokens?.threeX?.balance?.add(threeXBatchData?.tokens?.threeX?.claimableBalance), threeXBatchData?.tokens?.threeX?.price) : constants.Zero),
    [threeXBatchData],
  );
  const butterStakingHoldings = useMemo(
    () =>
      butterStakingPool && butterBatchData ? getHoldingValue(butterStakingPool.userStake, butterBatchData?.tokens?.butter?.price) : constants.Zero,
    [butterStakingPool, butterBatchData],
  );
  const threeXStakingHoldings = useMemo(
    () =>
      threeXStakingPool && threeXBatchData ? getHoldingValue(threeXStakingPool.userStake, threeXBatchData?.tokens?.threeX?.price) : constants.Zero,
    [threeXStakingPool, threeXBatchData],
  );
  const mainnetEscrowHoldings = useMemo(
    () => (mainnetEscrow ? getHoldingValue(mainnetEscrow?.totalClaimablePop?.add(mainnetEscrow?.totalVestingPop), raisedPopPrice) : constants.Zero),
    [mainnetEscrow],
  );
  const polygonEscrowHoldings = useMemo(
    () => (polygonEscrow ? getHoldingValue(polygonEscrow?.totalClaimablePop?.add(polygonEscrow?.totalVestingPop), raisedPopPrice) : constants.Zero),
    [polygonEscrow],
  );
  const bnbEscrowHoldings = useMemo(
    () => (bnbEscrow ? getHoldingValue(bnbEscrow?.totalClaimablePop?.add(bnbEscrow?.totalVestingPop), raisedPopPrice) : constants.Zero),
    [bnbEscrow],
  );
  const arbitrumEscrowHoldings = useMemo(
    () => (arbitrumEscrow ? getHoldingValue(arbitrumEscrow?.totalClaimablePop?.add(arbitrumEscrow?.totalVestingPop), raisedPopPrice) : constants.Zero),
    [arbitrumEscrow],
  );
  const butterRedeemBatchHoldings = useMemo(
    () => (butterBatchData ? getHoldingValue(butterBatchData?.tokens?.threeCrv?.claimableBalance, butterBatchData?.tokens?.threeCrv?.price) : constants.Zero),
    [butterBatchData],
  );
  const threeXRedeemBatchHoldings = useMemo(
    () => (threeXBatchData ? getHoldingValue(threeXBatchData?.tokens?.usdc?.claimableBalance, threeXBatchData?.tokens?.usdc?.price) : constants.Zero),
    [threeXBatchData],
  );


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
    threeXRedeemBatchHoldings
  ].reduce((total, num) => total.add(num));
}
