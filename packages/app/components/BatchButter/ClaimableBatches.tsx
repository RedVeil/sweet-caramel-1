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
    <table className="min-w-full">
      <thead>
        <tr>
          <th
            scope="col"
            className="px-6 py-4 text-left font-medium bg-gray-100 rounded-tl-2xl w-5/12"
          >
            Deposited Token
          </th>
          <th
            scope="col"
            className="px-6 py-4 text-left font-medium bg-gray-100 w-5/12"
          >
            Claimable Token
          </th>
          <th
            scope="col"
            className="pl-6 pr-28 py-4 text-right font-medium bg-gray-100 rounded-tr-2xl w-2/12"
          >
            Action
          </th>
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
