import { formatAndRoundBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useChainIdFromUrl } from "hooks/useChainIdFromUrl";
import { useDeployment } from "hooks/useDeployment";
import { Escrow, useGetUserEscrows } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";
import { useEffect, useState } from "react";
import { SWRResponse } from "swr";
import PortfolioItem from "../../PortfolioItem";

const Vesting = () => {
  const { account } = useWeb3();
  const chainId = useChainIdFromUrl();
  const { rewardsEscrow, vaultsRewardsEscrow } = useDeployment(chainId);

  const userEscrowsFetchResult: SWRResponse<
    { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
    any
  > = useGetUserEscrows(rewardsEscrow, account, chainId);

  const userVaultsEscrowsFetchResults: SWRResponse<
    { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
    any
  > = useGetUserEscrows(vaultsRewardsEscrow, account, chainId);

  const [userEscrowData, setUserEscrowData] = useState<{ totalClaimablePop: BigNumber; totalVestingPop: BigNumber }>();

  useEffect(() => {
    if (!userEscrowsFetchResult?.data && !userVaultsEscrowsFetchResults?.data) {
      return;
    }
    setUserEscrowData({
      totalClaimablePop: userEscrowsFetchResult?.data?.totalClaimablePop.add(
        userVaultsEscrowsFetchResults?.data?.totalClaimablePop || "0",
      ),
      totalVestingPop: BigNumber.from("0")
        .add(userEscrowsFetchResult?.data?.totalVestingPop || "0")
        .add(userVaultsEscrowsFetchResults?.data?.totalVestingPop || "0"),
    });
  }, [userEscrowsFetchResult?.data, userVaultsEscrowsFetchResults?.data]);

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
      <PortfolioItem title="Vesting" statusLabels={statusLabels}></PortfolioItem>
      {/* )} */}
    </>
  );
};

export default Vesting;
