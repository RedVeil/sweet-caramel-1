import type { TransactionResponse } from "@ethersproject/providers";
import { isAddress } from "ethers/lib/utils";
import { useCallback } from "react";
// import ERC20ABI from "abis/ERC20.json";
import useVestingEscrow from "./useVestingEscrow";
import useWeb3 from "./useWeb3";

export default function useClaimEscrows() {
  const { library, account, chainId, contractAddresses } = useWeb3();
  const vestingEscrow = useVestingEscrow(contractAddresses.rewardsEscrow);
  return useCallback(
    async (escrowIds: string[]): Promise<TransactionResponse | null> => {
      if (
        !contractAddresses.rewardsEscrow ||
        !escrowIds.length ||
        !account ||
        !chainId ||
        !isAddress(contractAddresses.rewardsEscrow) ||
        !vestingEscrow ||
        (await vestingEscrow.provider.getNetwork()).chainId !== chainId
      ) {
        return null;
      }
      if (escrowIds.length === 1) {
        return vestingEscrow.claimReward(escrowIds[0]);
      } else {
        return vestingEscrow.claimRewards(escrowIds);
      }
    },
    [library, account, chainId, vestingEscrow],
  );
}
