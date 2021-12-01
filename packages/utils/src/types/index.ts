export type Address = string;

export interface ContractAddresses {
  staking: Array<Address>;
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
}

export interface ButterDependencyAddresses {
  basicIssuanceModule: Address;
  yDusd: Address;
  yFrax: Address;
  yUsdn: Address;
  yUst: Address;
  dusdMetapool: Address;
  fraxMetapool: Address;
  usdnMetapool: Address;
  ustMetapool: Address;
  triPool: Address;
}
