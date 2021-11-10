import { SingleStakingStats } from '@popcorn/utils';
import router from 'next/router';
import TokenIcon from './TokenIcon';

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-md w-full mr-4 px-8 py-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          <TokenIcon token={tokenName} />
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
          <p className="text-gray-500 text-base font-medium uppercase">
            Est. APY
          </p>
          <p className="text-green-600 text-xl font-medium">
            {stakingStats.apy.toLocaleString()} %
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-base font-medium uppercase">
            Total Staked
          </p>
          <p className="text-gray-800 text-xl font-medium">
            {stakingStats.totalStake.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-base font-medium uppercase">
            Token Emissions
          </p>
          <p className="text-gray-800 text-xl font-medium">
            {stakingStats.tokenEmission.toLocaleString()} POP / day
          </p>
        </div>
      </div>
    </div>
  );
}
