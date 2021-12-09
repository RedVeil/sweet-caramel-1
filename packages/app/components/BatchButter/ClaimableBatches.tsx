import { Dispatch } from 'react';
import { AccountBatch } from '../../../hardhat/lib/adapters';
import ClaimableBatch from './ClaimableBatch';

interface ClaimableBatchesProps {
  batches: AccountBatch[];
  claim: Function;
  withdraw: Function;
  slippage: number;
  setSlippage: Dispatch<number>;
}

const ClaimableBatches: React.FC<ClaimableBatchesProps> = ({
  batches,
  claim,
  withdraw,
  slippage,
  setSlippage,
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
            key={batch.batchId}
            batch={batch}
            index={i}
            claim={claim}
            withdraw={withdraw}
            slippage={slippage}
            setSlippage={setSlippage}
          />
        ))}
      </tbody>
    </table>
  );
};
export default ClaimableBatches;
