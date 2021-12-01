import { BigNumber } from 'ethers';

export enum BatchType {
  Mint,
  Redeem,
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

export interface DepositRequest {
  batchNumber: number;
  batchId: string;
  depositAmount: number;
  despositCurrency: string;
  HYSITokenToReceive: number;
  submittedRequestDatetime: Date;
  claimable: boolean;
  index: number;
  amount: number;
}
