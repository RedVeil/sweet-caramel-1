import { calculateMultipleAPY, formatAndRoundBigNumber, numberToBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import useArrakisStaking from "hooks/portfolio/staking/useArrakisStaking";
import useButterStaking from "hooks/portfolio/staking/useButterStaking";
import usePopStaking from "hooks/portfolio/staking/usePopStaking";
import useThreeXStaking from "hooks/portfolio/staking/useThreeXStaking";
import PortfolioItem from "../PortfolioItem";
import EarnedRewardsButton from "./EarnedRewardsButton";
import StakingItems from "./StakingItems";

const StakingProduct = () => {
  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  // usePopStaking()
  const { popProductProps, popHasValue, popTotalBigNumberValues } = usePopStaking();
  const { butterProps, butterHasValue, butterTotalBigNumberValues } = useButterStaking();
  const { threeXProps, threeXHasValue, threeXTotalBigNumberValues } = useThreeXStaking();
  const { arrakisProps, arrakisHasValue, arrakisTotalBigNumberValues } = useArrakisStaking();

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

  const totalTVL = formatAndRoundBigNumber(
    multiStakingData.reduce((prev, next) => {
      return prev.add(next?.tvl);
    }, numberToBigNumber(0, 18)),
    18,
  );

  const totalEarned = formatAndRoundBigNumber(
    multiStakingData.reduce((prev, next) => {
      return prev.add(next?.earned);
    }, numberToBigNumber(0, 18)),
    18,
  );

  const totalVAPR =
    totalDepositedBigNumber > numberToBigNumber(0, 18)
      ? calculateMultipleAPY(stakingProductsWithDepositedValue, totalDepositedBigNumber)
      : numberToBigNumber(0, 18);

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
      <PortfolioItem title="Staking" statusLabels={statusLabels} badge={badge} show={totalContracts > 0}>
        <StakingItems {...stakingItemProps} />
        {totalEarned && (
          <EarnedRewardsButton
            title="Total Unclaimed Rewards"
            amount={totalEarned}
            buttonLabel="Rewards Page"
            link="/rewards"
          />
        )}
      </PortfolioItem>
    </>
  );
};

export default StakingProduct;
