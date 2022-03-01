import { AccountBatch, BatchType } from "@popcorn/hardhat/lib/adapters";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { InfoIconWithModal } from "components/InfoIconWithModal";
import MainActionButton from "components/MainActionButton";
import SecondaryActionButton from "components/SecondaryActionButton";

export interface BatchProps {
  batch: AccountBatch;
  handleClaimAndStake: (batch: AccountBatch) => void;
  handleClaim: (batch: AccountBatch) => void;
  handleWithdraw: (batch: AccountBatch) => void;
}

const ClaimableBatch: React.FC<BatchProps> = ({ batch, handleClaimAndStake, handleClaim, handleWithdraw }) => {
  return (
    <tr className="even:bg-gray-100 odd:bg-white last:rounded-b-2xl w-full">
      <td className="px-6 py-5 whitespace-nowrap">
        <span className="flex flex-row items-center">
          {`${formatAndRoundBigNumber(batch.accountSuppliedTokenBalance)} ${
            batch.batchType === BatchType.Mint ? "3CRV " : "BTR"
          }`}
          {batch.batchType === BatchType.Mint && (
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
        {`${formatAndRoundBigNumber(batch.accountClaimableTokenBalance)} ${
          batch.batchType === BatchType.Mint ? "BTR" : "3CRV"
        }`}
      </td>
      <td className="px-6 py-5 flex justify-end">
        <div className="w-36">
          {batch.claimable && batch.batchType === BatchType.Mint ? (
            <div className="space-y-4">
              <MainActionButton label="Claim and Stake" handleClick={(e) => handleClaimAndStake(batch)} />
              <SecondaryActionButton label="Claim" handleClick={(e) => handleClaim(batch)} />
            </div>
          ) : (
            <MainActionButton
              label={batch.claimable ? "Claim" : "Cancel"}
              handleClick={(e) => (batch.claimable ? handleClaim(batch) : handleWithdraw(batch))}
            />
          )}
        </div>
      </td>
    </tr>
  );
};
export default ClaimableBatch;
