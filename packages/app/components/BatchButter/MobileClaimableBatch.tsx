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
  isFourX = false,
}) => {
  return (
    <div className="flex flex-col even:bg-gray-100 odd:bg-white last:rounded-b-2xl w-full p-6">
      <div className="flex flex-row justify-between">
        <StatusWithLabel
          label="Claimable Tokens"
          content={formatBatchInputToken(
            batch.accountSuppliedTokenBalance,
            batch.batchType === BatchType.Mint,
            isFourX,
          )}
        />
        <div className="w-1/3">
          {batch.claimable && batch.batchType === BatchType.Mint && (
            <MainActionButton handleClick={() => handleClaimAndStake(batch)} disabled={false} label="Stake" />
          )}
          {batch.claimable && batch.batchType === BatchType.Redeem && (
            <MainActionButton label="Claim" handleClick={() => handleClaim(batch)} />
          )}
          {!batch.claimable && <SecondaryActionButton label="Cancel" handleClick={() => handleWithdraw(batch)} />}
        </div>
      </div>
      <div className="flex flex-row justify-between mt-10">
        <StatusWithLabel
          label="Deposited"
          content={formatBatchOutputToken(
            batch.accountClaimableTokenBalance,
            batch.batchType === BatchType.Mint,
            isFourX,
          )}
        />
        <div className="w-1/3">
          {batch.claimable && batch.batchType === BatchType.Mint && (
            <SecondaryActionButton handleClick={() => handleClaim(batch)} disabled={false} label="Claim" />
          )}
        </div>
      </div>
    </div>
  );
};
export default MobileClaimableBatch;
