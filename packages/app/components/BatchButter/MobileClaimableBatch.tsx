import { BatchType } from "@popcorn/utils/src/types";
import StatusWithLabel from "components/Common/StatusWithLabel";
import MainActionButton from "components/MainActionButton";
import SecondaryActionButton from "components/SecondaryActionButton";
import { formatBatchInputToken, formatBatchOutputToken } from "helper/ClaimableBatchUtils";
import { BatchProps } from "./ClaimableBatch";

const MobileClaimableBatch: React.FC<BatchProps> = ({
  batch,
  handleClaimAndStake,
  handleClaim,
  handleWithdraw,
  isThreeX = false,
}) => {
  return (
    <div className="flex flex-col bg-white border-b border-gray-200 last:border-none last:rounded-b-2xl w-full p-6">
      <div className="flex flex-row justify-between">
        <StatusWithLabel
          label="Deposited"
          content={formatBatchOutputToken(
            batch.accountClaimableTokenBalance,
            batch.batchType === BatchType.Mint,
            isThreeX,
          )}
        />
        <StatusWithLabel
          label="Claimable"
          content={formatBatchInputToken(
            batch.accountSuppliedTokenBalance,
            batch.batchType === BatchType.Mint,
            isThreeX,
          )}
        />
      </div>
      <div className="flex flex-col space-y-4 mt-10">
        <div className="w-full">
          {batch.claimable && batch.batchType === BatchType.Mint && (
            <MainActionButton handleClick={() => handleClaimAndStake(batch)} disabled={false} label="Claim & Stake" />
          )}
          {batch.claimable && batch.batchType === BatchType.Redeem && (
            <SecondaryActionButton label="Claim" handleClick={() => handleClaim(batch)} />
          )}
          {!batch.claimable && <SecondaryActionButton label="Cancel" handleClick={() => handleWithdraw(batch)} />}
        </div>
        <div className="w-full">
          {batch.claimable && batch.batchType === BatchType.Mint && (
            <SecondaryActionButton handleClick={() => handleClaim(batch)} disabled={false} label="Claim" />
          )}
        </div>
      </div>
    </div>
  );
};
export default MobileClaimableBatch;
