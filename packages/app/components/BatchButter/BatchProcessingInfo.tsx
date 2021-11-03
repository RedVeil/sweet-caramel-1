import { TimeTillBatchProcessing } from '@popcorn/contracts';
import CircularProgressbar from 'react-circular-progressbar';

interface BatchProcessingInfoProps {
  timeTillBatchProcessing: TimeTillBatchProcessing[];
}

const BatchProcessingInfo: React.FC<BatchProcessingInfoProps> = ({
  timeTillBatchProcessing,
}) => {
  return (
    <div className="bg-white rounded-lg shadow px-5 py-6 mt-16 flex flex-row">
      <div className="w-2/3 flex flex-row">
        <div className="w-24 h-24 flex-shrink-0 flex-grow-0 mr-4">
          {timeTillBatchProcessing && (
            <CircularProgressbar
              percentage={timeTillBatchProcessing[0].progressPercentage}
              initialAnimation={true}
              styles={{
                // Customize the root svg element
                root: {},
                // Customize the path, i.e. the "completed progress"
                path: {
                  stroke: `rgba(62, 152, 199, ${60 / 100})`,
                  strokeLinecap: 'butt',
                  // Customize transition animation
                  transition: 'stroke-dashoffset 0.5s ease 0s',
                },
                trail: {
                  stroke: '#d6d6d6',
                },
              }}
            />
          )}
        </div>
        <div>
          {timeTillBatchProcessing && (
            <h2 className="font-semibold text-base text-gray-900 mb-2">
              {`${timeTillBatchProcessing[0].timeTillProcessing.getUTCHours()} Hours
          ${timeTillBatchProcessing[0].timeTillProcessing.getUTCMinutes()} Minutes
          ${timeTillBatchProcessing[0].timeTillProcessing.getUTCSeconds()} Seconds left`}
            </h2>
          )}
          <p>
            We reduce your gas fee/transaction with doing deposit in batch. This
            batch will automatically submitted after reach our schedule. When
            the batch is completed you can claim the HYSI token to be displayed
            on your wallet
          </p>
        </div>
      </div>
      <div className="w-1/3 flex justify-end">
        <button className="px-3 h-12 rounded-lg font-semibold bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700">
          See History
        </button>
      </div>
    </div>
  );
};
export default BatchProcessingInfo;
