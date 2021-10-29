import router from 'next/router';
import * as Icon from 'react-feather';
import MainActionButton from './MainActionButton';

interface StakingCardProbs {
  tokenName: string;
  apy: number;
  stakedBalance: number;
  url?: string;
}

const StakingCard: React.FC<StakingCardProbs> = ({
  tokenName,
  apy,
  stakedBalance,
  url,
}) => {
  return (
    <div className="w-1/3 rounded-md shadow bg-white mr-4 py-4">
      <div className="flex flex-row items-center px-4">
        <div className="w-12 h-12 bg-pink-400 rounded-full flex items-center">
          <Icon.Lock className="text-white mx-auto w-4 h-4" />
        </div>
        <h1 className="ml-12 text-xl text-gray-800 font-medium">
          {tokenName} Staking
        </h1>
      </div>
      <div className="border-b border-gray-200 py-2"></div>
      <div className="px-4">
        <div className="mt-8">
          <p className="text-gray-700 text-lg">APY</p>
          <p className="text-gray-800 text-lg font-medium">
            {apy.toLocaleString()}%
          </p>
        </div>
        <div className="mt-2">
          <p className="text-gray-700 text-lg">Your Stake</p>
          <p className="text-gray-800 text-lg font-medium">
            {stakedBalance.toLocaleString()}
          </p>
        </div>
        <div className="mt-8">
          <MainActionButton
            label="Select"
            handleClick={() => router.push(`/staking/${url ? url : tokenName}`)}
          />
        </div>
      </div>
    </div>
  );
};
export default StakingCard;
