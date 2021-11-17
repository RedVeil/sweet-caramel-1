import * as Icon from 'react-feather';
import MainActionButton from './MainActionButton';
interface ClaimCardProps {
  tokenName: string;
  apy: number;
  claimable: number;
  handleClick: Function;
}

const ClaimCard: React.FC<ClaimCardProps> = ({
  tokenName,
  apy,
  claimable,
  handleClick,
}) => {
  return (
    <div className="w-1/3 rounded-md shadow-lg bg-gray-50 mr-4 py-6">
      <div className="flex flex-row items-center px-6">
        <div className="px-4 py-4 bg-white border border-gray-200 rounded-lg w-full">
          <p className="font-light text-sm text-gray-500 uppercase">Token</p>
          <h1 className="text-xl text-gray-800 font-medium">{tokenName}</h1>
        </div>
      </div>
      <div className="bg-green-500 rounded-2xl w-28 mx-6 py-1 px-2 flex flex-row items-center mt-4">
        <Icon.CheckCircle className="w-4 h-4 text-white" />
        <p className="text-white ml-2">Claimable</p>
      </div>
      <div className="px-6 flex flex-row items-center mt-6">
        <div className="w-1/2">
          <p className="text-gray-500 font-light uppercase">APY</p>
          <p className="text-gray-800 text-lg font-medium">
            {apy.toLocaleString()}%
          </p>
        </div>
        <div className="w-1/2">
          <p className="text-gray-500 font-light uppercase">Claimable</p>
          <p className="text-gray-800 text-lg font-medium">
            {claimable.toLocaleString()} POP
          </p>
        </div>
      </div>
      <div className="mt-8 mx-6">
        <MainActionButton label="Claim" handleClick={handleClick} />
      </div>
    </div>
  );
};
export default ClaimCard;
