import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import useGetUserEscrows from "@popcorn/app/hooks/useGetUserEscrows";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { ChainId } from "@popcorn/utils";
import { constants } from "ethers";
import { useMemo, } from "react";

export default function useEscrows(chainId: ChainId) {
  const { account } = useWeb3()
  const {
    rewardsEscrow,
    vaultsRewardsEscrow,
  } = useDeployment(chainId);

  const { data: escrowsFetchResult, isValidating, mutate: revalidateEscrowsFetchResult } = useGetUserEscrows(rewardsEscrow, account, chainId);
  const { data: vaultsEscrowsFetchResults, mutate: revalidateVaultsEscrowsFetchResults } = useGetUserEscrows(vaultsRewardsEscrow, account, chainId);

  return useMemo(
    () => {
      return {
        escrows: []
          .concat(escrowsFetchResult?.escrows || [])
          .concat(vaultsEscrowsFetchResults?.escrows || []),
        totalClaimablePop: constants.Zero
          .add(escrowsFetchResult?.totalClaimablePop || "0")
          .add(vaultsEscrowsFetchResults?.totalClaimablePop || "0"),
        totalVestingPop: constants.Zero
          .add(escrowsFetchResult?.totalVestingPop || "0")
          .add(vaultsEscrowsFetchResults?.totalVestingPop || "0"),
        revalidate: () => {
          revalidateEscrowsFetchResult();
          revalidateVaultsEscrowsFetchResults();
        }
      }
    },
    [escrowsFetchResult, vaultsEscrowsFetchResults, revalidateEscrowsFetchResult, revalidateVaultsEscrowsFetchResults],
  );
}