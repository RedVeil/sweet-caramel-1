import { ChainId, formatAndRoundBigNumber, numberToBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import useArrakisStaking from "hooks/portfolio/staking/useArrakisStaking";
import useButterStaking from "hooks/portfolio/staking/useButterStaking";
import usePopStaking from "hooks/portfolio/staking/usePopStaking";
import useThreeXStaking from "hooks/portfolio/staking/useThreeXStaking";
import useGetYearnAPY from "hooks/set/useGetYearnAPY";
import useSetComponentAddresses from "hooks/set/useSetComponentAddresses";
import useThreeXData from "hooks/set/useThreeXData";
import useThreeXWhaleData from "hooks/set/useThreeXWhaleData";
import useStakingPool from "hooks/staking/useStakingPool";
import useTotalTokenSupply from "hooks/tokens/useTotalTokenSupply";
import { useDeployment } from "hooks/useDeployment";
import PortfolioItem from "../PortfolioItem";
import EarnedRewardsButton from "./EarnedRewardsButton";

const ThreeXProduct = () => {
  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  const { popProductProps, popHasValue, popTotalBigNumberValues } = usePopStaking();
  const { butterProps, butterHasValue, butterTotalBigNumberValues } = useButterStaking();
  const { threeXProps, threeXHasValue, threeXTotalBigNumberValues } = useThreeXStaking();
  const { arrakisProps, arrakisHasValue, arrakisTotalBigNumberValues } = useArrakisStaking();
  const { Ethereum, Polygon } = ChainId;
  const contractAddresses = useDeployment(Ethereum);
  const { data: threeXData, error: errorFetchingThreeXData, mutate: refetchThreeXBatchData } = useThreeXData(Ethereum);
  const {
    data: threeXWhaleData,
    error: errorFetchingThreeXWhaleData,
    mutate: refetchThreeXWhaleData,
  } = useThreeXWhaleData(Ethereum);
  const threeXToken = threeXData?.tokens?.find((token) => token.address === contractAddresses.threeX);
  const { threeX, threeXStaking: threeXStakingAddress, butterStaking: butterStakingAddress } = useDeployment(Ethereum);
  const yearnAddresses = useSetComponentAddresses(threeXToken?.address);
  const { data: threeXAPY } = useGetYearnAPY(yearnAddresses, ChainId.Ethereum);
  const { data: threeXStaking } = useStakingPool(threeXStakingAddress, Ethereum);
  const tokenSupply = useTotalTokenSupply(threeXToken?.address, Ethereum);
  console.log(threeXData?.totalSupply.toString());

  const stakingItemProps = {
    popProductProps,
    butterProps,
    threeXProps,
    arrakisProps,
    popHasValue,
    butterHasValue,
    threeXHasValue,
    arrakisHasValue,
  };
  const multiStakingData = [
    popTotalBigNumberValues,
    butterTotalBigNumberValues,
    threeXTotalBigNumberValues,
    arrakisTotalBigNumberValues,
  ];

  const stakingProductsWithDepositedValue = multiStakingData.filter(
    (stakingData) => stakingData.deposited > numberToBigNumber(0, 18),
  );

  const totalContracts = stakingProductsWithDepositedValue.length;

  const totalDepositedBigNumber = multiStakingData.reduce((prev: BigNumber, next) => {
    return prev.add(next.deposited);
  }, numberToBigNumber(0, 18));

  const totalDeposited = formatAndRoundBigNumber(totalDepositedBigNumber, 18);

  const totalTVL = threeXToken?.price
    ? formatAndRoundBigNumber(tokenSupply.mul(threeXToken?.price).div(parseEther("1")), threeXToken?.decimals)
    : "0";

  const totalEarned = formatAndRoundBigNumber(
    multiStakingData.reduce((prev, next) => {
      return prev.add(next?.earned);
    }, numberToBigNumber(0, 18)),
    18,
  );

  const totalVAPR =
    threeXStaking?.apy && threeXToken
      ? formatAndRoundBigNumber(threeXStaking.apy.add(parseUnits(String(threeXAPY || 0))), threeXToken?.decimals)
      : "0";

  const badge = {
    text: `${totalContracts} contracts`,
    textColor: "text-black",
    bgColor: "bg-customYellow",
  };

  const statusLabels = [
    {
      content: `$${totalTVL}`,
      label: "TVL",
      infoIconProps: {
        id: "staking-tvl",
        title: "How we calculate the TVL",
        content: "How we calculate the TVL is lorem ipsum",
      },
    },
    {
      content: `${totalVAPR}%`,
      label: "vAPR",
      infoIconProps: {
        id: "staking-vAPR",
        title: "How we calculate the vAPR",
        content: "How we calculate the vAPR is lorem ipsum",
      },
    },
    {
      content: `$${totalDeposited}`,
      label: "Deposited",
      infoIconProps: {
        id: "staking-deposited",
        title: "How we calculate the Deposited",
        content: "How we calculate the Deposited is lorem ipsum",
      },
    },
  ];

  return (
    <>
      {totalContracts > 0 && (
        <PortfolioItem title="3X" statusLabels={statusLabels} badge={badge}>
          {totalEarned && (
            <EarnedRewardsButton
              title="Total Unclaimed Rewards"
              amount={totalEarned}
              buttonLabel="Rewards Page"
              link="/rewards"
            />
          )}
        </PortfolioItem>
      )}
    </>
  );
};

export default ThreeXProduct;
