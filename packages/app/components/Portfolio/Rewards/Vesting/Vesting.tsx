import { formatAndRoundBigNumber, numberToBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import useArrakisStaking from "hooks/portfolio/staking/useArrakisStaking";
import PortfolioItem from "../../PortfolioItem";

const Vesting = () => {
  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  const { arrakisProps, arrakisHasValue, arrakisTotalBigNumberValues } = useArrakisStaking();

  const stakingItemProps = {
    arrakisProps,
    arrakisHasValue,
  };

  const multiStakingData = [arrakisTotalBigNumberValues];

  const stakingProductsWithDepositedValue = multiStakingData.filter(
    (stakingData) => stakingData.deposited > numberToBigNumber(0, 18),
  );

  const totalContracts = stakingProductsWithDepositedValue.length;

  const totalDepositedBigNumber = multiStakingData.reduce((prev: BigNumber, next) => {
    return prev.add(next.deposited);
  }, numberToBigNumber(0, 18));

  const totalDeposited = formatAndRoundBigNumber(totalDepositedBigNumber, 18);

  const statusLabels = [
    {
      content: `$${totalDeposited}`,
      label: "Total value",
      infoIconProps: {
        id: "staking-tvl",
        title: "How we calculate the TVL",
        content: "How we calculate the TVL is lorem ipsum",
      },
    },
    {
      content: `$${totalDeposited}`,
      label: "Claimable",
      infoIconProps: {
        id: "staking-tvl",
        title: "How we calculate the TVL",
        content: "How we calculate the TVL is lorem ipsum",
      },
    },
  ];

  return (
    <>
      {/* {totalContracts > 0 && ( */}
      <PortfolioItem title="Vesting" statusLabels={statusLabels}></PortfolioItem>
      {/* )} */}
    </>
  );
};

export default Vesting;
