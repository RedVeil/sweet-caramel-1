import { RewardsEscrow } from "@popcorn/hardhat/typechain";
import { BigNumber, constants } from "ethers";
import useSWR from "swr";
import { getChainRelevantContracts } from "../../hardhat/lib/utils/getContractAddresses";
import useVestingEscrow from "./useVestingEscrow";
import useWeb3 from "./useWeb3";

export type Escrow = {
  start: BigNumber;
  lastUpdateTime: BigNumber;
  end: BigNumber;
  balance: BigNumber;
  account: string;
  claimableAmount: BigNumber;
  id: string;
};

const getEscrowsByIds = async (vestingEscrow: RewardsEscrow, escrowIds: string[]) => {
  const result = [];
  const escrows = await vestingEscrow.getEscrows(escrowIds);
  escrows.forEach((escrow, index) => {
    result.push({
      lastUpdateTime: escrow.lastUpdateTime.mul(1000),
      end: escrow.end.mul(1000),
      balance: escrow.balance,
      account: escrow.account,
      id: escrowIds[index],
    });
  });
  return result;
};

const getUserEscrows = () => async (_: any, account: string, vestingEscrow: RewardsEscrow, library) => {
  const escrowIds: string[] = await vestingEscrow.getEscrowIdsByUser(account);
  if (escrowIds.length === 0) {
    return { escrows: new Array(0), totalClaimablePop: constants.Zero, totalVestingPop: constants.Zero };
  }
  let totalClaimablePop: BigNumber = constants.Zero;
  let totalVestingPop: BigNumber = constants.Zero;
  const escrows = (await getEscrowsByIds(vestingEscrow, escrowIds))
    .filter((escrow) => escrow.balance.gt(constants.Zero))
    .filter((escrow) => !BAD_ESCROW_IDS.includes(escrow.id));

  for (let i = 0; i < escrows.length; i++) {
    escrows[i].claimableAmount = await (async () => {
      let claimable;
      try {
        claimable = await vestingEscrow.getClaimableAmount(escrows[i].id);
      } catch (e) {
        claimable = BigNumber.from(0);
      }
      return claimable;
    })();
    totalVestingPop = totalVestingPop.add(escrows[i].balance.sub(escrows[i].claimableAmount));
    totalClaimablePop = totalClaimablePop.add(escrows[i].claimableAmount);
  }
  escrows.sort((a, b) => a.end.toNumber() - b.end.toNumber());
  return {
    escrows,
    totalClaimablePop,
    totalVestingPop,
  };
};

export default function useGetUserEscrows() {
  const { signerOrProvider, account, chainId } = useWeb3();
  const contractAddresses = getChainRelevantContracts(chainId);
  const vestingEscrow = useVestingEscrow(contractAddresses.rewardsEscrow);
  const shouldFetch = !!vestingEscrow && !!account;
  return useSWR(shouldFetch ? ["getUserEscrows", account, vestingEscrow, signerOrProvider] : null, getUserEscrows(), {
    refreshInterval: 2000,
  });
}

const BAD_ESCROW_IDS = ["0xb5e39b26e424fc1affd47eaa035ac492b765b6dae4985c2762d829f986b43418"];
