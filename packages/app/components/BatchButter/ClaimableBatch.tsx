import { setDualActionWideModal } from 'context/actions';
import { store } from 'context/store';
import { Dispatch, useContext, useState } from 'react';
import { AccountBatch, BatchType } from '../../../hardhat/lib/adapters';
import { bigNumberToNumber } from '../../../utils';
import OutputToken from './OutputToken';
import SlippageSettings from './SlippageSettings';

interface OutputToken {
  name: string;
  stableIndex?: number;
}

const OUTPUT_TOKEN = ['3CRV', 'DAI', 'USDC', 'USDT'];

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
  const [selectedOutputToken, selectOutputToken] = useState<string>('3CRV');

  function handleClaim() {
    if (batch.batchType === BatchType.Redeem) {
      dispatch(
        setDualActionWideModal({
          title: 'Choose an Output Token',
          content: (
            <div className="flex flex-col mt-4">
              <OutputToken
                outputToken={OUTPUT_TOKEN}
                selectOutputToken={selectOutputToken}
              />
              <div className="mt-4">
                <SlippageSettings
                  slippage={slippage}
                  setSlippage={setSlippage}
                />
              </div>
            </div>
          ),
          onConfirm: {
            label: 'Claim',
            onClick: () => {
              claim(
                batch.batchId,
                selectedOutputToken !== '3CRV',
                selectedOutputToken.toLowerCase(),
              );
              dispatch(setDualActionWideModal(false));
              selectOutputToken('3CRV');
            },
          },
          onDismiss: {
            label: 'Cancel',
            onClick: () => {
              dispatch(setDualActionWideModal(false));
              selectOutputToken('3CRV');
            },
          },
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
            <div className="flex flex-col mt-4">
              <OutputToken
                outputToken={OUTPUT_TOKEN}
                selectOutputToken={selectOutputToken}
              />
              <div className="mt-4">
                <SlippageSettings
                  slippage={slippage}
                  setSlippage={setSlippage}
                />
              </div>
            </div>
          ),
          onConfirm: {
            label: 'Withdraw',
            onClick: () => {
              withdraw(
                batch.batchId,
                batch.accountSuppliedTokenBalance,
                selectedOutputToken !== '3CRV',
                selectedOutputToken.toLowerCase(),
              );
              dispatch(setDualActionWideModal(false));
              selectOutputToken('3CRV');
            },
          },
          onDismiss: {
            label: 'Cancel',
            onClick: () => {
              dispatch(setDualActionWideModal(false));
              selectOutputToken('3CRV');
            },
          },
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
        {`${bigNumberToNumber(batch.accountSuppliedTokenBalance)} ${
          batch.batchType === BatchType.Mint ? '3CRV' : 'HYSI'
        }`}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
        {`${bigNumberToNumber(batch.accountClaimableTokenBalance)} ${
          batch.batchType === BatchType.Mint ? 'HYSI' : '3CRV'
        }`}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
        {batch.claimable ? 'Claimable' : 'Not Claimable'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <a
          href="#"
          className="font-semibold text-indigo-600 hover:text-indigo-900"
          onClick={(e) => (batch.claimable ? handleClaim() : handleWithdraw())}
        >
          {batch.claimable ? 'Claim' : 'Withdraw'}
        </a>
      </td>
    </tr>
  );
};
export default ClaimableBatch;
