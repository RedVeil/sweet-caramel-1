import { setDualActionWideModal } from 'context/actions';
import { store } from 'context/store';
import { useContext } from 'react';
import { AccountBatch, BatchType } from '../../../hardhat/lib/adapters';
import { bigNumberToNumber } from '../../../utils';

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
}

const ClaimableBatch: React.FC<BatchProps> = ({
  batch,
  index,
  claim,
  withdraw,
}) => {
  const { dispatch } = useContext(store);

  function handleClaim() {
    let selectedOutputToken;
    if (batch.batchType === BatchType.Redeem) {
      dispatch(
        setDualActionWideModal({
          title: 'Choose an Output Token',
          content: (
            <div>
              <fieldset className="mt-4">
                <div className="flex justify-center">
                  <div className="flex flex-row items-center space-x-4">
                    {OUTPUT_TOKEN.map((outputToken) => (
                      <div key={outputToken} className="flex items-center">
                        <input
                          id={outputToken}
                          name="notification-method"
                          type="radio"
                          defaultChecked={outputToken === '3CRV'}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                          onClick={() => (selectedOutputToken = outputToken)}
                        />
                        <label
                          htmlFor={outputToken}
                          className="ml-3 block text-sm font-medium text-gray-700"
                        >
                          {outputToken}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </fieldset>
            </div>
          ),
          onConfirm: {
            label: 'Claim',
            onClick: () => {
              console.log('selected: ', selectedOutputToken);
              claim(
                batch.batchId,
                selectedOutputToken !== '3CRV',
                selectedOutputToken.toLowerCase(),
              );
              dispatch(setDualActionWideModal(false));
            },
          },
          onDismiss: {
            label: 'Cancel',
            onClick: () => dispatch(setDualActionWideModal(false)),
          },
        }),
      );
    } else {
      claim(batch.batchId);
    }
  }

  function handleWithdraw() {
    let selectedOutputToken;

    if (batch.batchType === BatchType.Mint) {
      dispatch(
        setDualActionWideModal({
          title: 'Choose an Output Token',
          content: (
            <div>
              <fieldset className="mt-4">
                <div className="flex justify-center">
                  <div className="flex flex-row items-center space-x-4">
                    {OUTPUT_TOKEN.map((outputToken) => (
                      <div key={outputToken} className="flex items-center">
                        <input
                          id={outputToken}
                          name="notification-method"
                          type="radio"
                          defaultChecked={outputToken === '3CRV'}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                          onClick={() => (selectedOutputToken = outputToken)}
                        />
                        <label
                          htmlFor={outputToken}
                          className="ml-3 block text-sm font-medium text-gray-700"
                        >
                          {outputToken}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </fieldset>
            </div>
          ),
          onConfirm: {
            label: 'Withdraw',
            onClick: () => {
              console.log('selected: ', selectedOutputToken);
              withdraw(
                batch.batchId,
                selectedOutputToken !== '3CRV',
                selectedOutputToken.toLowerCase(),
              );
              dispatch(setDualActionWideModal(false));
            },
          },
          onDismiss: {
            label: 'Cancel',
            onClick: () => dispatch(setDualActionWideModal(false)),
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
