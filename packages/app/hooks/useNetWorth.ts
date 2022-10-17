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
import useGetPopTokenPriceInUSD from "./useGetPopTokenPriceInUSD";
import { useGetUserEscrows, useGetUserVaultsEscrows } from "./useGetUserEscrows";
import useWeb3 from "./useWeb3";

function getHoldingValue(tokenAmount: BigNumber, tokenPrice: BigNumber): BigNumber {
  tokenAmount = tokenAmount ? tokenAmount : constants.Zero;
  return tokenAmount.eq(constants.Zero) || tokenPrice.eq(constants.Zero)
    ? constants.Zero
    : tokenAmount.mul(tokenPrice).div(constants.WeiPerEther);
}


export default function useNetWorth(): { [key: string | keyof ChainId]: { total: BigNumber, vesting: BigNumber, inWallet: BigNumber } } {
  const { account, contractAddresses } = useWeb3();
  const { pop, butter, threeX, butterStaking, threeXStaking, popStaking } = useMemo(
    () => getChainRelevantContracts(ChainId.Ethereum),
    [],
  );
  const { pop: polygonPopAddress, popStaking: polygonPopStakingAddress } = useMemo(
    () => getChainRelevantContracts(ChainId.Polygon),
    [],
  );
  const { pop: bnbPopAddress } = useMemo(() => getChainRelevantContracts(ChainId.BNB), []);
  const { pop: arbitrumPopAddress } = useMemo(() => getChainRelevantContracts(ChainId.Arbitrum), []);

  const erc20 = useCallback((address: string, rpcProvider) => ERC20__factory.connect(address, rpcProvider), []);

  const { data: mainnetPopStaking } = usePopLocker(popStaking);
  const { data: polygonPopStaking } = usePopLocker(polygonPopStakingAddress);
  const { data: butterStakingPool } = useStakingPool(butterStaking);
  const { data: threeXStakingPool } = useStakingPool(threeXStaking);
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const { data: butterBatchData } = useButterBatchData(PRC_PROVIDERS[ChainId.Ethereum]);
  const { data: threeXBatchData } = useThreeXData(PRC_PROVIDERS[ChainId.Ethereum]);
  const { data: mainnetPopBalance } = useTokenBalance(erc20(pop, PRC_PROVIDERS[ChainId.Ethereum]), account);
  const { data: polygonPopBalance } = useTokenBalance(
    erc20(polygonPopAddress, PRC_PROVIDERS[ChainId.Polygon]),
    account,
  );
  const { data: bnbPopBalance } = useTokenBalance(erc20(bnbPopAddress, PRC_PROVIDERS[ChainId.BNB]), account);
  const { data: arbitrumPopBalance } = useTokenBalance(
    erc20(arbitrumPopAddress, PRC_PROVIDERS[ChainId.Arbitrum]),
    account,
  );
  const { data: mainnetEscrow } = useGetUserEscrows(ChainId.Ethereum, PRC_PROVIDERS[ChainId.Ethereum]);
  const { data: polygonEscrow } = useGetUserEscrows(ChainId.Polygon, PRC_PROVIDERS[ChainId.Polygon]);
  const { data: bnbEscrow } = useGetUserEscrows(ChainId.BNB, PRC_PROVIDERS[ChainId.BNB]);
  const { data: arbitrumEscrow } = useGetUserEscrows(ChainId.Arbitrum, PRC_PROVIDERS[ChainId.Arbitrum]);

  const { data: mainnetVaultEscrow } = useGetUserVaultsEscrows(ChainId.Ethereum, PRC_PROVIDERS[ChainId.Ethereum]);
  const { data: polygonVaultEscrow } = useGetUserVaultsEscrows(ChainId.Polygon, PRC_PROVIDERS[ChainId.Polygon]);
  const { data: bnbVaultEscrow } = useGetUserVaultsEscrows(ChainId.BNB, PRC_PROVIDERS[ChainId.BNB]);
  const { data: arbitrumVaultEscrow } = useGetUserVaultsEscrows(ChainId.Arbitrum, PRC_PROVIDERS[ChainId.Arbitrum]);

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
  const mainnetEscrowHoldings = useMemo(
    () =>
      mainnetEscrow
        ? getHoldingValue(
          BigNumber.from("0")
            .add(mainnetEscrow?.totalClaimablePop || "0")
            .add(mainnetEscrow?.totalVestingPop || "0")
            .add(mainnetVaultEscrow?.totalClaimablePop || "0")
            .add(mainnetVaultEscrow?.totalVestingPop || "0"),
          raisedPopPrice,
        )
        : constants.Zero,
    [mainnetEscrow],
  );
  const polygonEscrowHoldings = useMemo(
    () =>
      polygonEscrow
        ? getHoldingValue(
          BigNumber.from("0")
            .add(polygonEscrow?.totalClaimablePop || "0")
            .add(polygonEscrow?.totalVestingPop || "0")
            .add(polygonVaultEscrow?.totalClaimablePop || "0")
            .add(polygonVaultEscrow?.totalVestingPop || "0"),
          raisedPopPrice,
        )
        : constants.Zero,
    [polygonEscrow],
  );
  const bnbEscrowHoldings = useMemo(
    () =>
      bnbEscrow
        ? getHoldingValue(
          BigNumber.from("0")
            .add(bnbEscrow?.totalClaimablePop || "0")
            .add(bnbEscrow?.totalVestingPop || "0")
            .add(bnbVaultEscrow?.totalClaimablePop || "0")
            .add(bnbVaultEscrow?.totalVestingPop || "0"),
          raisedPopPrice,
        )
        : constants.Zero,
    [bnbEscrow],
  );
  const arbitrumEscrowHoldings = useMemo(
    () =>
      arbitrumEscrow
        ? getHoldingValue(
          BigNumber.from("0")
            .add(arbitrumEscrow?.totalClaimablePop || "0")
            .add(arbitrumEscrow?.totalVestingPop || "0")
            .add(arbitrumVaultEscrow?.totalClaimablePop || "0")
            .add(arbitrumVaultEscrow?.totalVestingPop || "0"),
          raisedPopPrice,
        )
        : constants.Zero,
    [arbitrumEscrow],
  );
  const butterHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === contractAddresses.butter);
    return getHoldingValue(butter?.balance?.add(butter?.claimableBalance), butter?.price);
  }, [butterBatchData]);
  const threeXHoldings = useMemo(() => {
    if (!threeXBatchData) return constants.Zero;
    const threeX = butterBatchData?.tokens.find((token) => token.address === contractAddresses.threeX);
    return getHoldingValue(threeX?.balance?.add(threeX?.claimableBalance), threeX?.price);
  }, [threeXBatchData]);
  const butterStakingHoldings = useMemo(() => {
    if (!butterStakingPool || !butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === contractAddresses.butter);
    return getHoldingValue(butterStakingPool.userStake, butter?.price);
  }, [butterStakingPool, butterBatchData]);
  const threeXStakingHoldings = useMemo(() => {
    if (!threeXStakingPool || !threeXBatchData) return constants.Zero;
    const threeX = threeXBatchData?.tokens.find((token) => token.address === contractAddresses.threeX);
    return getHoldingValue(threeXStakingPool.userStake, threeX?.price);
  }, [threeXStakingPool, threeXBatchData]);
  const butterRedeemBatchHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const threeCrv = butterBatchData?.tokens.find((token) => token.address === contractAddresses.threeCrv);
    return getHoldingValue(threeCrv?.claimableBalance, threeCrv?.price);
  }, [butterBatchData]);
  const threeXRedeemBatchHoldings = useMemo(() => {
    if (!threeXBatchData) return constants.Zero;
    const usdc = threeXBatchData?.tokens.find((token) => token.address === contractAddresses.usdc);
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
  }

  const calculatePolygonHoldings = (): BigNumber => {
    return [
      polygonPopHoldings,
      polygonPopStakingHoldings,
      polygonEscrowHoldings,
    ].reduce((total, num) => total.add(num));
  }

  const calculateArbitrumHoldings = (): BigNumber => {
    return [
      arbitrumPopHoldings,
      arbitrumEscrowHoldings,
    ].reduce((total, num) => total.add(num));
  }

  const calculateBnbHoldings = (): BigNumber => {
    return [
      bnbPopHoldings,
      bnbEscrowHoldings
    ].reduce((total, num) => total.add(num));
  }

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
    ].reduce((total, num) => total.add(num))
  }

  const calculateTotalPopHoldings = (): BigNumber => {
    return [
      mainnetPopHoldings,
      polygonPopHoldings,
      bnbPopHoldings,
      arbitrumPopHoldings
    ].reduce((total, num) => total.add(num))
  }

  const calculateTotalEscrowHoldings = (): BigNumber => {
    return [
      mainnetEscrowHoldings,
      polygonEscrowHoldings,
      bnbEscrowHoldings,
      arbitrumEscrowHoldings
    ].reduce((total, num) => total.add(num))
  }

  return {
    [ChainId.Ethereum]: {
      total: calculateEthereumHoldings(),
      inWallet: mainnetPopHoldings,
      vesting: mainnetEscrowHoldings
    },
    [ChainId.Polygon]: {
      total: calculatePolygonHoldings(),
      inWallet: polygonPopHoldings,
      vesting: polygonEscrowHoldings
    },
    [ChainId.BNB]: {
      total: calculateBnbHoldings(),
      inWallet: bnbPopHoldings,
      vesting: bnbEscrowHoldings
    },
    [ChainId.Arbitrum]: {
      total: calculateArbitrumHoldings(),
      inWallet: arbitrumPopHoldings,
      vesting: arbitrumEscrowHoldings
    },
    totalNetWorth: {
      total: calculateTotalHoldings(),
      inWallet: calculateTotalPopHoldings(),
      vesting: calculateTotalEscrowHoldings()
    },
  }
}
