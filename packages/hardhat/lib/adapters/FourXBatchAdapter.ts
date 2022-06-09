import { Batch } from "@popcorn/utils/src/types";
import ButterBatchAdapter from "./ButterBatchAdapter";
import { FourXBatchProcessing } from "../../typechain/FourXBatchProcessing";
import { BigNumber } from "ethers";

export class FourXBatchAdapter extends ButterBatchAdapter {
  constructor(contract: FourXBatchProcessing) {
    super(contract);
  }
  async getBatch(batchId: string): Promise<Batch> {
    const batch = await this.contract.getBatch(batchId);
    return {
      batchType: batch.batchType,
      batchId: batch.batchId,
      claimable: batch.claimable,
      unclaimedShares: batch.unclaimedShares,
      suppliedTokenBalance: batch.sourceTokenBalance,
      claimableTokenBalance: batch.targetTokenBalance,
      suppliedTokenAddress: batch.sourceToken,
      claimableTokenAddress: batch.targetToken,
    };
  }
  async getAcountBalance(batchId, address): Promise<BigNumber> {
    return this.contract.getAccountBalance(batchId, address);
  }
  async getProcessingThreshold(): Promise<{
    batchCooldown: BigNumber;
    mintThreshold: BigNumber;
    redeemThreshold: BigNumber;
  }> {
    return this.contract.processingThreshold();
  }
}

export default FourXBatchAdapter;
