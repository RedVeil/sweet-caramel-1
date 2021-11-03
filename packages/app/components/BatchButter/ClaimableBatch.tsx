import { BigNumber } from '@ethersproject/bignumber';
import {
  AccountBatch,
  BatchType,
} from '@popcorn/contracts/adapters/HYSIBatchInteraction/HYSIBatchInteractionAdapter';
import { bigNumberToNumber } from '@popcorn/utils';

interface BatchProps {
  batch: AccountBatch;
  index: number;
  claim: (batchId: string) => Promise<void>;
  withdraw: (batchId: string, amount: BigNumber) => Promise<void>;
}

const ClaimableBatch: React.FC<BatchProps> = ({
  batch,
  index,
  claim,
  withdraw,
}) => {
  return (
    <tr
      key={batch.batchId}
      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
        {`${bigNumberToNumber(batch.accountSuppliedTokenBalance)} ${
          batch.batchType === BatchType.Mint ? '3CRV' : 'HYSI'
        }`}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
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
          onClick={(e) =>
            batch.claimable
              ? claim(batch.batchId)
              : withdraw(batch.batchId, batch.accountSuppliedTokenBalance)
          }
        >
          {batch.claimable ? 'Claim' : 'Withdraw'}
        </a>
      </td>
    </tr>
  );
};
export default ClaimableBatch;
