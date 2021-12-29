export type Address = string;

export interface ContractAddresses {
  staking?: Array<Address>;
  popStaking?: Address;
  pop?: Address;
  dai?: Address;
  usdc?: Address;
  usdt?: Address;
  threeCrv?: Address;
  popUsdcLp?: Address;
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
