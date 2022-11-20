import { numberToBigNumber } from "@popcorn/utils";
import { formatDate } from "@popcorn/utils/src/DateTime";
import { BigNumber } from "ethers";
import React from "react";
import { DepositRequest } from "../../../../interfaces/popcorn/BatchHYSI";

interface DepositRequestRowProps {
  depositRequest: DepositRequest;
  claim: (batchId: string) => Promise<void>;
  withdraw: (batchId: string, amount: BigNumber) => Promise<void>;
}

export const DepositRequestRow: React.FC<DepositRequestRowProps> = ({ depositRequest, claim, withdraw }) => {
  return (
    <tr key={depositRequest.batchNumber} className={depositRequest.index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{depositRequest.batchNumber}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
        {formatDate(depositRequest.submittedRequestDatetime)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
        {`${depositRequest.despositCurrency} ${depositRequest.depositAmount}`}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{depositRequest.HYSITokenToReceive}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
        {depositRequest.claimable ? "Claimable" : "Not Claimable"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <a
          href="#"
          className="font-semibold text-indigo-600 hover:text-indigo-900"
          onClick={(e) =>
            depositRequest.claimable
              ? claim(depositRequest.batchId)
              : withdraw(depositRequest.batchId, numberToBigNumber(depositRequest.amount))
          }
        >
          {depositRequest.claimable ? "Claim" : "Withdraw"}
        </a>
      </td>
    </tr>
  );
};
