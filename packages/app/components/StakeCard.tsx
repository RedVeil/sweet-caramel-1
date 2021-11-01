import { SingleStakingStats } from '@popcorn/utils';
import router from 'next/router';

const tokenIcon = (tokenName: string): JSX.Element => {
  switch (tokenName) {
    case 'POP':
      return (
        <div className="flex items-center rounded-full bg-white border border-gray-300 w-8 h-8">
          <img
            src="images/icons/popLogo.png"
            alt="eth"
            className="w-8 h-8 mx-auto"
          />
        </div>
      );
    case 'POP/ETH LP':
      return (
        <div className="flex flex-row">
          <div className="flex items-center rounded-full bg-white border border-gray-300 w-8 h-8">
            <img
              src="images/icons/ethLogo.png"
              alt="eth"
              className="w-3 h-5 mx-auto"
            />
          </div>
          <div className="flex items-center rounded-full bg-white border border-gray-300 w-8 h-8 -ml-1">
            <img
              src="images/icons/popLogo.png"
              alt="eth"
              className="w-8 h-8 mx-auto"
            />
          </div>
        </div>
      );
    case 'BUTTER':
      return (
        <div className="flex items-center rounded-full bg-white border border-gray-300 w-8 h-8">
          <img
            src="images/icons/butterLogo.png"
            alt="eth"
            className="w-8 h-8 mx-auto"
          />
        </div>
      );
  }
};
interface StakeCardProps {
  tokenName: string;
  stakingStats: SingleStakingStats;
  url: string;
}

export default function StakeCard({
  tokenName,
  stakingStats,
  url,
}: StakeCardProps): JSX.Element {
  return (
    <div className="bg-white rounded-md border border-gray-200 shadow-lg w-full mr-4 px-8 py-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          {tokenIcon(tokenName)}
          <h3 className="ml-6 text-xl font-medium text-gray-800">
            {tokenName}
          </h3>
        </div>
        <button
          className="button rounded-full py-1 px-5 text-white bg-blue-600 hover:bg-blue-700"
          type="button"
          onClick={() => router.push(`staking/${url}`)}
        >
          Stake
        </button>
      </div>
      <div className="flex flex-row items-center mt-6 w-2/3 justify-between">
        <div>
          <p className="text-gray-500 font-medium uppercase">Est. APY</p>
          <p className="text-green-600 text-xl font-medium">
            {stakingStats.apy.toLocaleString()} %
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-medium uppercase">Total Staked</p>
          <p className="text-gray-800 text-xl font-medium">
            {stakingStats.totalStake.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-medium uppercase">Token Emissions</p>
          <p className="text-gray-800 text-xl font-medium">
            {stakingStats.tokenEmission.toLocaleString()} POP / day
          </p>
        </div>
      </div>
    </div>
  );
}
