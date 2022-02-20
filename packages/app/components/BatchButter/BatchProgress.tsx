import { formatAndRoundBigNumber } from "@popcorn/utils";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";

interface BatchProgressProps {
  batchAmount: BigNumber;
  threshold: BigNumber;
}

const BatchProgress: React.FC<BatchProgressProps> = ({ batchAmount, threshold }) => {
  return (
    <div className="bg-white border border-gray-200 shadow-custom rounded-2xl h-full flex flex-col">
      <div className="w-full flex flex-row pt-5 pb-2 px-6 h-full">
        <div className="w-16 h-16 flex-shrink-0 flex-grow-0 mr-4 rounded-full bg-gray-100 flex flex-row items-center justify-center">
          <p className="text-2xl font-semibold leading-none text-gray-700">
            {formatAndRoundBigNumber(batchAmount.div(1000), 0)}k
          </p>
        </div>
        <div className="w-full">
          <div className="flex flex-row items-center w-full justify-between pt-1">
            <p className="font-normal leading-none text-gray-500 text-base uppercase">Batch</p>
            <InfoIconWithTooltip
              id="3"
              title="Batch Processing"
              content=" Your mint/redeem request will be processed after the current batch is ready to be processed. The expected wait time is about 24 hours."
            />
          </div>
          <p className="text-gray-900 leading-snug mr-8">Your request will be processed with the next batch.</p>
        </div>
      </div>
      <div className="h-3 bg-blue-200 rounded-b-2xl mask overflow-hidden">
        <div
          className={`h-3 bg-blue-800 rounded-bl-2xl ${batchAmount === threshold ? "rounded-br-2xl" : "rounded-r-2xl"}`}
          style={{ width: `${formatAndRoundBigNumber(batchAmount.mul(parseEther("100")).div(threshold), 0)}%` }}
        ></div>
      </div>
    </div>
  );
};
export default BatchProgress;
