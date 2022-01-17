import { bigNumberToNumber } from '@popcorn/utils';
import { format } from 'date-fns';
import { Escrow } from 'hooks/useGetUserEscrows';

interface VestingRecordProps {
  vestingEscrow: Escrow;
  index: number;
  claim: (Escrow) => void;
}

const VestingRecordComponent: React.FC<VestingRecordProps> = ({
  vestingEscrow,
  index,
  claim,
}) => {
  const formattedEndDate = format(vestingEscrow.end.toNumber(), 'MM.dd.yyyy');

  return (
    <div
      className={`flex flex-row justify-between px-8 ${
        index % 2 === 0 ? 'bg-rewardsBg2' : 'bg-rewardsBg'
      } w-full h-36`}
    >
      <div className="flex flex-row justify-between w-full">
        <div className="flex flex-col my-auto">
          <p className={`text-base text-gray-500 my-auto`}>UNLOCK ENDS</p>
          <h1 className={`text-2xl font-medium text-gray-900 my-auto`}>
            {formattedEndDate}
          </h1>
        </div>

        <div className="flex flex-col my-auto">
          <p className={`text-base text-gray-500 my-auto`}>
            TOTAL VESTED TOKENS
          </p>
          <h1 className={`text-2xl font-medium text-gray-900 my-auto`}>
            <span className="text-gray-900">
              {bigNumberToNumber(vestingEscrow.balance).toLocaleString(
                undefined,
                { maximumFractionDigits: 2 },
              )}
            </span>{' '}
            POP
          </h1>
        </div>

        <div className="flex flex-col my-auto">
          <p className={`text-base text-gray-500 my-auto`}>CLAIMABLE TOKENS</p>
          <h1 className={`text-2xl font-medium text-gray-900 my-auto`}>
            <span className="text-gray-900">
              {bigNumberToNumber(vestingEscrow.claimableAmount).toLocaleString(
                undefined,
                { maximumFractionDigits: 2 },
              )}
            </span>{' '}
            POP
          </h1>
        </div>
      </div>
      <div className="w-1/4 my-auto flex flex-row justify-end">
        <button
          onClick={() => claim(vestingEscrow)}
          disabled={!vestingEscrow.claimableAmount.gte(0)}
          className="my-auto bg-blue-600 rounded-full py-3 px-10 mb-1 leading-none cursor-pointer hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-default"
        >
          <p className="font-semibold text-lg text-white">Claim</p>
        </button>
      </div>
    </div>
  );
};

export default VestingRecordComponent;
