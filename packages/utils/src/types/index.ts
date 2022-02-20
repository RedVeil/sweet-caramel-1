import { BigNumber } from "ethers";
import { ERC20 } from "../../../hardhat/typechain";

export type Address = string;
export interface ContractAddresses {
  staking?: Array<Address>;
  popStaking?: Address;
  pop?: Address;
  xPop?: Address;
  xPopRedemption?: Address;
  dai?: Address;
  usdc?: Address;
  usdt?: Address;
  threeCrv?: Address;
  threePool?: Address;
  popUsdcLp?: Address;
  popUsdcUniV3Pool?: Address;
  butter?: Address;
  butterBatch?: Address;
  butterBatchZapper?: Address;
  butterDependency?: ButterDependencyAddresses;
  aclRegistry?: Address;
  contractRegistry?: Address;
  // dao: DAO;
  voting?: Address;
  dao?: Address;
  daoAgent?: Address;
  daoTreasury?: Address;
  tokenManager?: Address;
  // other protocols
  balancerVault?: Address;
  balancerLBPFactory?: Address;
  merkleOrchard?: Address;
  rewardsEscrow?: Address;
  all: Set<Address>;
  has: (contract: string) => boolean;
}

export interface ERC20Contracts {
  usdc?: Address;
}

export interface DAO {
  voting?: Address;
  dao?: Address;
  daoAgent?: Address;
  daoTreasury?: Address;
  tokenManager?: Address;
}

export interface ButterDependencyAddresses {
  yFrax?: Address;
  yMim?: Address;
  crvFrax?: Address;
  crvMim?: Address;
  crvFraxMetapool?: Address;
  crvMimMetapool?: Address;
  threePool?: Address;
  curveAddressProvider?: Address;
  curveFactoryMetapoolDepositZap?: Address;
  uniswapRouter?: Address;
  setBasicIssuanceModule?: Address;
  setTokenCreator?: Address;
  setStreamingFeeModule?: Address;
}

export interface VestingRecord {
  unlockDate: string;
  vested: number;
  claimable: number;
}

export type Token = {
  contract: ERC20;
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance?: BigNumber;
  allowance?: BigNumber;
};

export type StakingPool = {
  address: string;
  tokenAddress: string;
  apy: string;
  totalStake: BigNumber;
  userStake: BigNumber;
  tokenEmission: BigNumber;
  earned?: BigNumber;
  withdrawable?: BigNumber;
  stakingToken: Token;
};

export type ToastConfig = {
  successMessage: string;
  errorMessage?: string;
  id: string;
};
