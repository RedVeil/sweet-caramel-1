import { AccountBatch, BatchType } from "@popcorn/hardhat/lib/adapters";
import { setDualActionWideModal } from "context/actions";
import { store } from "context/store";
import { Dispatch, useContext } from "react";
import ClaimableBatch from "./ClaimableBatch";
import MobileClaimableBatch from "./MobileClaimableBatch";
import ZapModal from "./ZapModal";

interface ClaimableBatchesProps {
  batches: AccountBatch[];
  claim: Function;
  claimAndStake: Function;
  withdraw: Function;
  slippage: number;
  setSlippage: Dispatch<number>;
}

const ClaimableBatches: React.FC<ClaimableBatchesProps> = ({
  batches,
  claim,
  claimAndStake,
  withdraw,
  slippage,
  setSlippage,
}) => {
  const { dispatch } = useContext(store);

  function handleClaim(batch: AccountBatch) {
    if (batch.batchType === BatchType.Redeem) {
      dispatch(
        setDualActionWideModal({
          title: "Choose an Output Token",
          content: (
            <ZapModal
              slippage={slippage}
              setSlippage={setSlippage}
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
              slippage={slippage}
              setSlippage={setSlippage}
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
          <tr>
            <th scope="col" className="px-6 py-4 text-left font-medium bg-gray-200 rounded-tl-2xl w-5/12">
              Deposited Token
            </th>
            <th scope="col" className="px-6 py-4 text-left font-medium bg-gray-200 w-5/12">
              Claimable Token
            </th>
            <th scope="col" className="pl-6 pr-28 py-4 text-right font-medium bg-gray-200 rounded-tr-2xl w-2/12">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {batches?.map((batch, i) => (
            <ClaimableBatch
              key={batch.batchId}
              batch={batch}
              handleClaim={handleClaim}
              handleClaimAndStake={handleClaimAndStake}
              handleWithdraw={handleWithdraw}
            />
          ))}
        </tbody>
      </table>
      <div className="md:hidden">
        <div className="bg-gray-200 rounded-t-xl py-2">
          <h3 className="text-center text-lg font-medium text-gray-900">Your Batches</h3>
        </div>
        <div>
          {batches?.map((batch, i) => (
            <MobileClaimableBatch
              key={batch.batchId}
              batch={batch}
              handleClaim={handleClaim}
              handleClaimAndStake={handleClaimAndStake}
              handleWithdraw={handleWithdraw}
            />
          ))}
        </div>
      </div>
    </>
  );
};
export default ClaimableBatches;
