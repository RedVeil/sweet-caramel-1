import { formatAndRoundBigNumber, formatBigNumber } from "@popcorn/utils";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import { BigNumber, constants } from "ethers";
import { parseEther } from "ethers/lib/utils";

interface BatchProgressProps {
  batchAmount: BigNumber;
  threshold: BigNumber;
}

const BatchProgress: React.FC<BatchProgressProps> = ({ batchAmount, threshold }) => {
  return (
    <div className="bg-white border border-gray-200 shadow-custom rounded-2xl h-full flex flex-col">
      <div className="w-full flex flex-row p-6 md:pb-3 h-full items-center justify-center">
        <div className="w-16 h-16 flex-shrink-0 flex-grow-0 mr-4 rounded-full bg-gray-100 flex flex-row items-center justify-center">
          <p className="text-xl font-semibold leading-none text-gray-700">
            {batchAmount.eq(constants.Zero)
              ? 0
              : (Number(formatBigNumber(batchAmount)) / 1000).toFixed(
                Number(formatBigNumber(batchAmount)) > 1000 ? 0 : 1,
              )}
            k
          </p>
        </div>
        <div className="w-full">
          <div className="flex flex-row items-center w-full justify-between pt-1">
            <p className="font-normal leading-none text-gray-500 text-base uppercase">Batch</p>
            <InfoIconWithTooltip
              classExtras="h-7 w-7 mt-0 ml-5"
              id="3"
              title="Batch Processing"
              content="Mint and redeem batches with at least $1000 are processed by keepers approximately every 48 hours. Batch sizes greater than $100k are processed sooner.  Network congestion may cause delays."
            />
          </div>
          <p className="text-gray-900 leading-snug break-words">
            Your mint/redeem deposit will be processed with the next batch.
          </p>
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
