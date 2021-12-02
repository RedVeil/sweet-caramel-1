export type Address = string;

export interface ContractAddresses {
  staking?: Array<Address>;
  pop?: Address;
  threeCrv?: Address;
  popEthLp?: Address;
  butter?: Address;
  butterBatch?: Address;
  butterBatchZapper?: Address;
  dai?: Address;
  usdc?: Address;
  usdt?: Address;
  aclRegistry?: Address;
  contractRegistry?: Address;
  hysiDependency?: ButterDependencyAddresses;
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
  threePool?: Address;
  setBasicIssuanceModule?: Address;
  uniswapRouter?: Address;
  curveAddressProvider?: Address;
  curveFactoryMetapoolDepositZap?: Address;
  crvDusd?: Address;
  crvFrax?: Address;
  crvUsdn?: Address;
  crvUst?: Address;
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
  basicIssuanceModule?: Address;
  yDusd?: Address;
  yFrax?: Address;
  yUsdn?: Address;
  yUst?: Address;
  dusdMetapool?: Address;
  fraxMetapool?: Address;
  usdnMetapool?: Address;
  ustMetapool?: Address;
  triPool?: Address;
}
