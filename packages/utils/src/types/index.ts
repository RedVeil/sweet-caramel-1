import { BigNumber, Contract } from "ethers";
import { ERC20, ISetToken } from "../../../hardhat/typechain";

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

export type HotSwapParameter = {
  batchIds: String[];
  amounts: BigNumber[];
};

export type SelectedToken = {
  input: BatchProcessToken;
  output: BatchProcessToken;
};

export type BatchProcessTokens = {
  butter: BatchProcessToken;
  threeCrv: BatchProcessToken;
  dai: BatchProcessToken;
  usdc: BatchProcessToken;
  usdt: BatchProcessToken;
};

export type BatchProcessToken = {
  key: string;
  claimableBalance?: BigNumber;
  price: BigNumber;
  img?: string;
  contract: ERC20 | ISetToken;
  name: string;
  decimals: number;
  balance?: BigNumber;
  allowance?: BigNumber;
};

export type ButterBatchData = {
  accountBatches: AccountBatch[];
  currentBatches: CurrentBatches;
  butterSupply: BigNumber;
  claimableMintBatches: AccountBatch[];
  claimableRedeemBatches: AccountBatch[];
  batchProcessTokens: BatchProcessTokens;
};

export enum BatchType {
  Mint,
  Redeem,
}

export interface CurrentBatches {
  mint: Batch;
  redeem: Batch;
}

export interface TimeTillBatchProcessing {
  timeTillProcessing: Date;
  progressPercentage: number;
}
export interface Batch {
  batchType: BatchType;
  batchId: string;
  claimable: boolean;
  unclaimedShares: BigNumber;
  suppliedTokenBalance: BigNumber;
  claimableTokenBalance: BigNumber;
  suppliedTokenAddress: string;
  claimableTokenAddress: string;
}

export interface AccountBatch extends Batch {
  accountSuppliedTokenBalance: BigNumber;
  accountClaimableTokenBalance: BigNumber;
}

export interface ComponentMap {
  // key is yTokenAddress
  [key: string]: {
    metaPool?: Contract;
    yPool?: Contract;
  };
}
