import { AccountBatch, BatchType, Token } from "@popcorn/utils/src/types";
import { setDualActionWideModal } from "context/actions";
import { store } from "context/store";
import { useContext } from "react";
import ClaimableBatch from "./ClaimableBatch";
import EmptyClaimableBatch from "./EmptyClaimableBatch";
import MobileClaimableBatch from "./MobileClaimableBatch";
import MobileEmptyClaimableBatches from "./MobileEmptyClaimableBatches";
import ZapModal from "./ZapModal";

interface ClaimableBatchesProps {
  options: Token[];
  slippage: number;
  setSlippage: (slippage: number) => void;
  batches: AccountBatch[];
  claim: Function;
  claimAndStake: Function;
  withdraw: Function;
  isThreeX?: boolean;
}

const ClaimableBatches: React.FC<ClaimableBatchesProps> = ({
  options,
  slippage,
  setSlippage,
  batches,
  claim,
  claimAndStake,
  withdraw,
  isThreeX = false,
}) => {
  const { dispatch } = useContext(store);

  function handleClaim(batch: AccountBatch) {
    if (batch.batchType === BatchType.Redeem) {
      dispatch(
        setDualActionWideModal({
          title: "Choose an Output Token",
          content: (
            <ZapModal
              tokenOptions={options}
              slippage={slippage}
              setSlippage={setSlippage}
              slippageOptions={[0.1, 0.5, 1]}
              closeModal={() => dispatch(setDualActionWideModal(false))}
              withdraw={withdraw}
              claim={claim}
              batchId={batch.batchId}
              withdrawAmount={batch.accountSuppliedTokenBalance}
            />
          ),
        }),
      );
    } else {
      claim(batch.batchId);
    }
  }

  function handleWithdraw(batch: AccountBatch) {
    if (batch.batchType === BatchType.Mint) {
      dispatch(
        setDualActionWideModal({
          title: "Choose an Output Token",
          content: (
            <ZapModal
              tokenOptions={options}
              slippage={slippage}
              setSlippage={setSlippage}
              slippageOptions={[0.1, 0.5, 1]}
              closeModal={() => dispatch(setDualActionWideModal(false))}
              withdraw={withdraw}
              claim={claim}
              batchId={batch.batchId}
              withdrawAmount={batch.accountSuppliedTokenBalance}
              isWithdraw
            />
          ),
        }),
      );
    } else {
      withdraw(batch.batchId, batch.accountSuppliedTokenBalance);
    }
  }

  function handleClaimAndStake(batch: AccountBatch) {
    claimAndStake(batch.batchId);
  }

  return (
    <>
      <table className="hidden md:table min-w-full">
        <thead>
          <tr className="border-b border-customLightGray">
            <th scope="col" className="py-4 text-left font-medium text-black w-5/12">
              Your Batches
            </th>
            <th scope="col" className="px-6 py-4 text-left font-medium w-5/12"></th>
            <th scope="col" className="pl-6 pr-28 py-4 text-right font-medium w-2/12"></th>
          </tr>
        </thead>
        {batches?.length > 0 ? (
          <tbody>
            {batches?.map((batch, i) => (
              <ClaimableBatch
                key={batch.batchId}
                batch={batch}
                handleClaim={handleClaim}
                handleClaimAndStake={handleClaimAndStake}
                handleWithdraw={handleWithdraw}
                isThreeX={isThreeX}
              />
            ))}
          </tbody>
        ) : (
          <tbody>
            <EmptyClaimableBatch />
          </tbody>
        )}
      </table>
      <div className="md:hidden">
        <div className="py-2 border-b border-customLightGray">
          <h3 className="font-medium text-black">Your Batches</h3>
        </div>
        {batches?.length > 0 ? (
          <div>
            {batches?.map((batch, i) => (
              <MobileClaimableBatch
                key={batch.batchId}
                batch={batch}
                handleClaim={handleClaim}
                handleClaimAndStake={handleClaimAndStake}
                handleWithdraw={handleWithdraw}
                isThreeX={isThreeX}
              />
            ))}
          </div>
        ) : (
          <MobileEmptyClaimableBatches />
        )}
      </div>
    </>
  );
};
export default ClaimableBatches;
