export type Address = string;

export interface ContractAddresses {
  staking?: Array<Address>;
  pop?: Address;
  dai?: Address;
  usdc?: Address;
  usdt?: Address;
  threeCrv?: Address;
  popEthLp?: Address;
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
  yDusd?: Address;
  yFrax?: Address;
  yUsdn?: Address;
  yUst?: Address;
  crvDusd?: Address;
  crvFrax?: Address;
  crvUsdn?: Address;
  crvUst?: Address;
  dusdMetapool?: Address;
  fraxMetapool?: Address;
  usdnMetapool?: Address;
  ustMetapool?: Address;
  threePool?: Address;
  curveAddressProvider?: Address;
  curveFactoryMetapoolDepositZap?: Address;
  uniswapRouter?: Address;
  basicIssuanceModule?: Address;
}
