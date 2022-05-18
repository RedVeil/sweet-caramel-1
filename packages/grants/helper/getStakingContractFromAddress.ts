import { Contracts } from "context/Web3/contracts";
import { PopLocker } from "../../hardhat/typechain/PopLocker";
import { Staking } from "../../hardhat/typechain/Staking";

export const getStakingContractFromAddress = (
  contracts: Contracts,
  stakingAddress: string,
): PopLocker | Staking | undefined => {
  if (contracts?.popStaking?.address === stakingAddress) {
    return contracts.popStaking;
  }
  return contracts?.staking?.find((contract) => contract.address === stakingAddress);
};
