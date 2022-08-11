import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { parseEther } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import { BigNumber, constants } from "ethers/lib/ethers";
import useGetButterTokenPriceInUSD from "./useGetButterTokenPriceInUSD";
import useGetThreeXTokenPrice from "./useGetTreeXTokenPrice";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import useWeb3 from "./useWeb3";
import usePopLocker from "./staking/usePopLocker";
import useStakingPool from "./staking/useStakingPool";
import useGetPopTokenPriceInUSD from "./useGetPopTokenPriceInUSD";
import useTokenBalance from "./tokens/useTokenBalance";
import { ERC20__factory } from "@popcorn/hardhat/typechain";

function getHoldingValue(tokenAmount: BigNumber, tokenPrice: BigNumber): BigNumber {
  tokenAmount = tokenAmount ? tokenAmount : constants.Zero;
  return tokenAmount.eq(constants.Zero) || tokenPrice.eq(constants.Zero) ? constants.Zero : tokenAmount.mul(tokenPrice).div(constants.WeiPerEther);
}


export default function useNetWorth(): BigNumber {
  const { account } = useWeb3();

  const { pop, butter, threeX, butterStaking, threeXStaking, popStaking } = useMemo(() => getChainRelevantContracts(ChainId.Ethereum), [])
  const { pop: polygonPopAddress, popStaking: polygonPopStakingAddress } = useMemo(() => getChainRelevantContracts(ChainId.Polygon), [])

  const erc20 = useCallback((address: string, rpcProvider) => ERC20__factory.connect(address, rpcProvider), [])

  const { data: mainnetPopStaking } = usePopLocker(popStaking);
  const { data: polygonPopStaking } = usePopLocker(polygonPopStakingAddress);
  const { data: butterStakingPool } = useStakingPool(butterStaking);
  const { data: threeXStakingPool } = useStakingPool(threeXStaking);
  const { data: butterPrice } = useGetButterTokenPriceInUSD();
  const { data: threeXPrice } = useGetThreeXTokenPrice();
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const { data: butterBalance } = useTokenBalance(erc20(butter, PRC_PROVIDERS[ChainId.Ethereum]), account);
  const { data: threeXBalance } = useTokenBalance(erc20(threeX, PRC_PROVIDERS[ChainId.Ethereum]), account);
  const { data: mainnetPopBalance } = useTokenBalance(erc20(pop, PRC_PROVIDERS[ChainId.Ethereum]), account);
  const { data: polygonPopBalance } = useTokenBalance(erc20(polygonPopAddress, PRC_PROVIDERS[ChainId.Polygon]), account);

  // // raise popPrice by 1e12
  const raisedPopPrice = useMemo(() => popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero, [popPrice])

  const mainnetPopHoldings = useMemo(() => mainnetPopBalance ? getHoldingValue(mainnetPopBalance, raisedPopPrice) : constants.Zero, [mainnetPopBalance])
  const polygonPopHoldings = useMemo(() => polygonPopBalance ? getHoldingValue(polygonPopBalance, raisedPopPrice) : constants.Zero, [polygonPopBalance])
  const mainnetPopStakingHoldings = useMemo(() => mainnetPopStaking ? getHoldingValue(mainnetPopStaking.userStake, raisedPopPrice) : constants.Zero, [mainnetPopStaking])
  const polygonPopStakingHoldings = useMemo(() => polygonPopStaking ? getHoldingValue(polygonPopStaking.userStake, raisedPopPrice) : constants.Zero, [polygonPopStaking])
  const butterHoldings = useMemo(() => butterBalance && butterPrice ? getHoldingValue(butterBalance, butterPrice) : constants.Zero, [butterBalance, butterPrice])
  const threeXHoldings = useMemo(() => threeXBalance && threeXPrice ? getHoldingValue(threeXBalance, threeXPrice) : constants.Zero, [threeXBalance, threeXPrice])
  const butterStakingHoldings = useMemo(() => butterStakingPool && butterPrice ? getHoldingValue(butterStakingPool.userStake, butterPrice) : constants.Zero, [butterStakingPool, butterPrice])
  const threeXStakingHoldings = useMemo(() => threeXStakingPool && threeXPrice ? getHoldingValue(threeXStakingPool.userStake, threeXPrice) : constants.Zero, [threeXStakingPool, threeXPrice])


  return [mainnetPopHoldings, polygonPopHoldings, mainnetPopStakingHoldings, polygonPopStakingHoldings, butterHoldings, threeXHoldings, butterStakingHoldings, threeXStakingHoldings].reduce((total, num) => total.add(num))
}