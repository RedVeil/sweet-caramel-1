import { BigNumber } from '@ethersproject/bignumber';
import { AccountBatch } from '@popcorn/contracts/adapters/HYSIBatchInteraction/HYSIBatchInteractionAdapter';
import ClaimableBatch from './ClaimableBatch';

interface ClaimableBatchesProps {
  batches: AccountBatch[];
  claim: (batchId: string) => Promise<void>;
  withdraw: (batchId: string, amount: BigNumber) => Promise<void>;
}

const ClaimableBatches: React.FC<ClaimableBatchesProps> = ({
  batches,
  claim,
  withdraw,
}) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Deposited Token
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Claimable Token
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Status
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          ></th>
        </tr>
      </thead>
      <tbody>
        {batches?.map((batch, i) => (
          <ClaimableBatch
            batch={batch}
            index={i}
            claim={claim}
            withdraw={withdraw}
            key={batch.batchId}
          />
        ))}
      </tbody>
    </table>
  );
};
export default ClaimableBatches;
