import { BigNumber } from 'ethers';
import { DepositRequest } from '../../../../interfaces/popcorn/BatchHYSI';
import { DepositRequestRow } from '../DepositRequestRow';

interface DepositRequestTableProps {
  depositRequests: DepositRequest[];
  claim: (batchId: string) => Promise<void>;
  withdraw: (batchId: string, amount: BigNumber) => Promise<void>;
}

export const DepositRequestTable: React.FC<DepositRequestTableProps> = ({
  depositRequests,
  claim,
  withdraw,
}) => {
  return (
    <div className="w-full px-6 lg:px-12 pb-12 my-8">
      <p className="text-2xl font-bold mb-2">Deposit Request</p>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Batch
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Submitted Request
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Deposit Amount
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              HYSI Token To Receive
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
          {depositRequests?.map((depositRequest, i) => (
            <DepositRequestRow
              depositRequest={depositRequest}
              claim={claim}
              withdraw={withdraw}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
