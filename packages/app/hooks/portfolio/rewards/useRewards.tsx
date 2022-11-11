import { BigNumber } from "ethers/lib/ethers";
import { useChainIdFromUrl } from "hooks/useChainIdFromUrl";
import { useDeployment } from "hooks/useDeployment";
import { Escrow, useGetUserEscrows } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";
import { useEffect, useState } from "react";
import { SWRResponse } from "swr";

export default function useRewards() {
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

  return userEscrowData;
}
