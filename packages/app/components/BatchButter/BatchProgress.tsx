import { InfoIconWithModal } from 'components/InfoIconWithModal';

interface BatchProgressProps {
  batchAmount: number;
  threshold: number;
}

const BatchProgress: React.FC<BatchProgressProps> = ({
  batchAmount,
  threshold,
}) => {
  return (
    <div className="bg-white border border-gray-200 shadow-custom rounded-3xl mt-8 mr-8">
      <div className="w-full flex flex-row pt-8 pb-6 px-6">
        <div className="w-20 h-20 flex-shrink-0 flex-grow-0 mr-4 rounded-full bg-gray-100 flex flex-row items-center justify-center">
          <p className="text-2xl font-semibold leading-none mt-1 text-gray-700">
            {(batchAmount / 1000).toFixed(0)}k
          </p>
        </div>
        <div>
          <div className="flex flex-row items-center">
            <p className="font-semibold leading-none">Batch Processing</p>
            <InfoIconWithModal title="Batch Processing" />
          </div>
          <p className="text-gray-500 leading-snug">
            We reduce your gas fee/transaction with doing deposit in batch. This
            batch will automatically submitted after reach our schedule.
          </p>
        </div>
      </div>
      <div className="h-4 w-full bg-blue-200 rounded-b-2xl mask overflow-hidden">
        <div
          className={`h-4 bg-blue-800 rounded-bl-2xl ${
            batchAmount === threshold ? 'rounded-br-2xl' : 'rounded-r-2xl'
          }`}
          style={{ width: `${(batchAmount / threshold) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
export default BatchProgress;
