import type { TransactionResponse } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { isAddress } from 'ethers/lib/utils';
import { useCallback } from 'react';
import { getChainRelevantContracts } from '../../hardhat/lib/utils/getContractAddresses';
// import ERC20ABI from "consts/abis/ERC20.json";
import useVestingEscrow from './useVestingEscrow';

export default function useClaimEscrows() {
  const { library, account, chainId } = useWeb3React();
  const contractAddresses = getChainRelevantContracts(chainId);
  const vestingEscrow = useVestingEscrow(contractAddresses.rewardsEscrow);
  return useCallback(
    async (escrowIds: string[]): Promise<TransactionResponse | null> => {
      if (
        !contractAddresses.rewardsEscrow ||
        !escrowIds ||
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
