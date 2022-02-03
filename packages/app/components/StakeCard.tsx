import { Web3Provider } from '@ethersproject/providers';
import { PopLocker, Staking } from '@popcorn/hardhat/typechain';
import { formatAndRoundBigNumber, getERC20Contract, StakingPoolInfo } from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import { getSanitizedTokenDisplayName } from 'helper/displayHelper';
import { formatStakedAmount } from 'helper/formatStakedAmount';
import router from 'next/router';
import { useCallback } from 'react';
import StatusWithLabel from './Common/StatusWithLabel';
import MainActionButton from './MainActionButton';
import TokenIcon from './TokenIcon';

interface StakeCardProps {
  tokenName: string;
  stakingPoolInfo: StakingPoolInfo;
  url: string;
  stakingContract: Staking | PopLocker | undefined;
}

const StakeCard: React.FC<StakeCardProps> = ({ tokenName, stakingPoolInfo, url, stakingContract }) => {
  const { library } = useWeb3React<Web3Provider>();

  const onSelectPool = useCallback(async () => {
    router.push(`staking/${url}`);
  }, [router, getERC20Contract, stakingContract, tokenName, stakingPoolInfo.stakedTokenAddress, library]);

  return (
    <div
      className="bg-white rounded-3xl border border-gray-200 shadow-custom p-6 md:p-8 cursor-pointer transform transition duration-150 ease-in-out hover:scale-101"
      onClick={async () => await onSelectPool()}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          <TokenIcon token={getSanitizedTokenDisplayName(tokenName)} />
          <h3 className="header-minor ml-4 ">{getSanitizedTokenDisplayName(tokenName)}</h3>
        </div>
        <div className="w-24 flex-shrink-0">
          <MainActionButton label="Stake" handleClick={async () => await onSelectPool()} />
        </div>
      </div>
      <div className="flex flex-row flex-wrap items-center mt-6 justify-between">
        <div className="w-1/2 md:w-1/4 mt-4">
          <StatusWithLabel
            content={'New 🍿✨'} //stakingPoolInfo.stakedTokenName === "Popcorn" ? stakingPoolInfo.apy + "%" :
            label="Est. APY"
            green
          />
        </div>
        <div className="w-1/2 md:w-1/4 mt-4">
          <StatusWithLabel content={formatStakedAmount(stakingPoolInfo.totalStake)} label="Total Staked" />
        </div>
        <div className="w-full md:w-1/2 mt-4">
          <StatusWithLabel
            content={`${formatAndRoundBigNumber(stakingPoolInfo.tokenEmission, 3)} POP / day`}
            label="Token Emissions"
          />
        </div>
      </div>
    </div>
  );
};

export default StakeCard;
