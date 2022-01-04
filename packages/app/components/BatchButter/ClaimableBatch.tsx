import MainActionButton from 'components/MainActionButton';
import { setDualActionWideModal } from 'context/actions';
import { store } from 'context/store';
import { Dispatch, useContext } from 'react';
import { AccountBatch, BatchType } from '../../../hardhat/lib/adapters';
import { bigNumberToNumber } from '../../../utils';
import ZapModal from './ZapModal';

interface BatchProps {
  batch: AccountBatch;
  index: number;
  claim: Function;
  withdraw: Function;
  slippage: number;
  setSlippage: Dispatch<number>;
}

const ClaimableBatch: React.FC<BatchProps> = ({
  batch,
  index,
  claim,
  withdraw,
  slippage,
  setSlippage,
}) => {
  const { dispatch } = useContext(store);

  function handleClaim() {
    if (batch.batchType === BatchType.Redeem) {
      dispatch(
        setDualActionWideModal({
          title: 'Choose an Output Token',
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

  function handleWithdraw() {
    if (batch.batchType === BatchType.Mint) {
      dispatch(
        setDualActionWideModal({
          title: 'Choose an Output Token',
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

  return (
    <tr
      key={batch.batchId}
      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
    >
      <td className="px-6 py-5 whitespace-nowrap">
        {`${bigNumberToNumber(batch.accountSuppliedTokenBalance)} ${
          batch.batchType === BatchType.Mint ? '3CRV' : 'BTR'
        }`}
      </td>
      <td className="px-6 py-5 whitespace-nowrap font-medium">
        {`${bigNumberToNumber(batch.accountClaimableTokenBalance)} ${
          batch.batchType === BatchType.Mint ? 'BTR' : '3CRV'
        }`}
      </td>
      <td className="px-6 py-5 flex justify-end">
        <div className="w-36">
          <MainActionButton
            label={batch.claimable ? 'Claim' : 'Withdraw'}
            handleClick={(e) =>
              batch.claimable ? handleClaim() : handleWithdraw()
            }
          />
        </div>
      </td>
    </tr>
  );
};
export default ClaimableBatch;
