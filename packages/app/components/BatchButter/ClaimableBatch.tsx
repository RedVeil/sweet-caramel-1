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
    <tr className="bg-white border-b border-gray-200 last:border-none last:rounded-b-2xl w-full">
      <td className="px-6 py-5 whitespace-nowrap">
        <p className="text-gray-500 mb-2">DEPOSITED</p>
        <span className="flex flex-row items-center text-gray-900 text-2xl font-semibold">
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
      <td className="px-6 py-5 whitespace-nowrap">
        <p className="text-gray-500 mb-2">CLAIMABLE</p>
        <p className="text-gray-900 text-2xl font-semibold">
          {formatBatchOutputToken(batch.accountClaimableTokenBalance, batch.batchType === BatchType.Mint, isThreeX)}
        </p>
      </td>
      <td className="px-6 py-5 flex justify-end">
        {batch.claimable && batch.batchType === BatchType.Mint ? (
          <div className="space-x-4 flex flex-row justify-end w-80">
            <div className="">
              <MainActionButton label="Claim and Stake" handleClick={(e) => handleClaimAndStake(batch)} />
            </div>
            <div className="">
              <SecondaryActionButton label="Claim" handleClick={(e) => handleClaim(batch)} />
            </div>
          </div>
        ) : (
          <div className="">
            <SecondaryActionButton
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
