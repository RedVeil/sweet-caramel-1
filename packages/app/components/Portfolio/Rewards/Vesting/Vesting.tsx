import { formatAndRoundBigNumber } from "@popcorn/utils";
import useRewards from "hooks/portfolio/rewards/useRewards";
import PortfolioItem from "../../PortfolioItem";

const Vesting = () => {
  const userEscrowData = useRewards();

  const statusLabels = [
    {
      content: `$${formatAndRoundBigNumber(userEscrowData?.totalVestingPop, 18)}`,
      label: "Total value",
      infoIconProps: {
        id: "staking-tvl",
        title: "Total Value",
        content:
          "Every time you claim rewards a new 'Vesting Record' below will be added. Rewards in each 'Vesting Record' unlock over time. Come back periodically to claim new rewards as they unlock.",
      },
    },
    {
      content: `$${formatAndRoundBigNumber(userEscrowData?.totalClaimablePop, 18)}`,
      label: "Claimable",
      infoIconProps: {
        id: "total-claimable",
        title: "Total Claimable",
        content:
          "This describes the total amount of Rewards that you can currently claim across all 'Vesting Records'.",
      },
    },
  ];

  return (
    <>
      {/* {totalContracts > 0 && ( */}
      <PortfolioItem title="Vesting" statusLabels={statusLabels} show>
        {/* add something here */}
      </PortfolioItem>
      {/* )} */}
    </>
  );
};

export default Vesting;
