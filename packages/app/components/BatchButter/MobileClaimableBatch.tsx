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
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <StatusWithLabel
            label="Deposited"
            content={formatBatchOutputToken(
              batch.accountClaimableTokenBalance,
              batch.batchType === BatchType.Mint,
              isThreeX,
            )}
          />
        </div>
        <div className="col-span-6">
          <StatusWithLabel
            label="Claimable"
            content={formatBatchInputToken(
              batch.accountSuppliedTokenBalance,
              batch.batchType === BatchType.Mint,
              isThreeX,
            )}
          />
        </div>
      </div>
      <div className="flex flex-col">
        {batch.claimable && batch.batchType === BatchType.Mint && (
          <div className="w-full mt-6">
            <MainActionButton handleClick={() => handleClaimAndStake(batch)} disabled={false} label="Claim & Stake" />
          </div>
        )}
        {batch.claimable && batch.batchType === BatchType.Redeem && (
          <div className="w-full mt-6">
            <SecondaryActionButton label="Claim" handleClick={() => handleClaim(batch)} />
          </div>
        )}
        {!batch.claimable && (
          <div className="w-full mt-6">
            <SecondaryActionButton label="Cancel" handleClick={() => handleWithdraw(batch)} />
          </div>
        )}

        {batch.claimable && batch.batchType === BatchType.Mint && (
          <div className="w-full mt-6">
            <SecondaryActionButton handleClick={() => handleClaim(batch)} disabled={false} label="Claim" />
          </div>
        )}
      </div>
    </div>
  );
};
export default MobileClaimableBatch;
