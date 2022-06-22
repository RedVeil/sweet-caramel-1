import { AccountBatch, BatchType } from "@popcorn/utils/src/types";
import { InfoIconWithModal } from "components/InfoIconWithModal";
import MainActionButton from "components/MainActionButton";
import SecondaryActionButton from "components/SecondaryActionButton";
import { formatBatchInputToken, formatBatchOutputToken } from "../../helper/ClaimableBatchUtils";
export interface BatchProps {
  batch: AccountBatch;
  handleClaimAndStake: (batch: AccountBatch) => void;
  handleClaim: (batch: AccountBatch) => void;
  handleWithdraw: (batch: AccountBatch) => void;
  isThreeX?: boolean;
}

const ClaimableBatch: React.FC<BatchProps> = ({
  batch,
  handleClaimAndStake,
  handleClaim,
  handleWithdraw,
  isThreeX = false,
}) => {
  return (
    <tr className="even:bg-gray-100 odd:bg-white last:rounded-b-2xl w-full">
      <td className="px-6 py-5 whitespace-nowrap">
        <span className="flex flex-row items-center">
          {formatBatchInputToken(batch.accountSuppliedTokenBalance, batch.batchType === BatchType.Mint, isThreeX)}
          {!isThreeX && batch.batchType === BatchType.Mint && (
            <div className="mb-1">
              <InfoIconWithModal title="Why do I see 3CRV?">
                <p>
                  Your stablecoins have been swapped into 3CRV in order to mint BTR. For this reason you see a 3CRV
                  balance here.
                </p>
              </InfoIconWithModal>
            </div>
          )}
        </span>
      </td>
      <td className="px-6 py-5 whitespace-nowrap font-medium">
        {formatBatchOutputToken(batch.accountClaimableTokenBalance, batch.batchType === BatchType.Mint, isThreeX)}
      </td>
      <td className="px-6 py-5 flex justify-end">
        {batch.claimable && batch.batchType === BatchType.Mint ? (
          <div className="space-x-4 flex flex-row justify-end w-80">
            <div className="w-36">
              <MainActionButton label="Claim and Stake" handleClick={(e) => handleClaimAndStake(batch)} />
            </div>
            <div className="w-36">
              <SecondaryActionButton label="Claim" handleClick={(e) => handleClaim(batch)} />
            </div>
          </div>
        ) : (
          <div className="w-36">
            <MainActionButton
              label={batch.claimable ? "Claim" : "Cancel"}
              handleClick={(e) => (batch.claimable ? handleClaim(batch) : handleWithdraw(batch))}
            />
          </div>
        )}
      </td>
    </tr>
  );
};
export default ClaimableBatch;
