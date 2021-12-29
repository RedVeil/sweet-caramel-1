import { RewardsEscrow } from '@popcorn/hardhat/typechain';
import { useWeb3React } from '@web3-react/core';
import {} from 'ethereumjs-util';
import { BigNumber } from 'ethers';
// import { formatEther } from 'ethers/utils';
import useSWR from 'swr';
import { getChainRelevantContracts } from '../../hardhat/lib/utils/getContractAddresses';
import useVestingEscrow from './useVestingEscrow';

export type Escrow = {
  start: BigNumber;
  end: BigNumber;
  balance: BigNumber;
  account: string;
  claimableAmount: BigNumber;
  id: string;
};

const getEscrowsByIds = async (
  vestingEscrow: RewardsEscrow,
  escrowIds: string[],
) => {
  const result = [];
  const escrows = await vestingEscrow.getEscrows(escrowIds);
  escrows.forEach((escrow, index) => {
    const escrowObject = {
      start: escrow.start.mul(1000),
      end: escrow.end.mul(1000),
      balance: escrow.balance,
      account: escrow.account,
      id: escrowIds[index],
    };
    result.push(escrowObject as Escrow);
  });
  return result;
};

const getClaimableAmountForEscrow = async (
  escrow: Escrow,
  blockTime: number,
): Promise<BigNumber> => {
  const escrowDuration = escrow.end.sub(escrow.start);
  const passedTime = BigNumber.from(String(blockTime * 1000)).sub(escrow.start);
  const claimableAmount = escrow.balance.mul(passedTime).div(escrowDuration);
  if (escrow.balance.gt(claimableAmount)) {
    return claimableAmount;
  } else {
    return escrow.balance;
  }
};

const getUserEscrows =
  () =>
  async (_: any, account: string, vestingEscrow: RewardsEscrow, library) => {
    const escrowIds: string[] = await vestingEscrow.getEscrowIdsByUser(account);
    if (escrowIds.length === 0) {
      return { escrows: new Array(0), totalClaimablePop: BigNumber.from('0') };
    }
    let totalClaimablePop: BigNumber = BigNumber.from('0');
    const escrows = await getEscrowsByIds(vestingEscrow, escrowIds);
    const blockTime = await (await library.getBlock('latest')).timestamp;
    for (let i = 0; i < escrows.length; i++) {
      escrows[i].claimableAmount = await getClaimableAmountForEscrow(
        escrows[i],
        blockTime,
      );
      totalClaimablePop = totalClaimablePop.add(escrows[i].claimableAmount);
    }
    escrows.sort((a, b) => a.end.toNumber() - b.end.toNumber());
    return {
      escrows,
      totalClaimablePop,
    };
  };

export default function useGetUserEscrows() {
  const { library, account, chainId } = useWeb3React();
  const contractAddresses = getChainRelevantContracts(chainId);
  const vestingEscrow = useVestingEscrow(contractAddresses.rewardsEscrow);
  const shouldFetch = !!vestingEscrow && !!account;
  return useSWR(
    shouldFetch ? ['getUserEscrows', account, vestingEscrow, library] : null,
    getUserEscrows(),
    {
      refreshInterval: 2000,
    },
  );
}
