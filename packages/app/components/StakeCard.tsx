import { Web3Provider } from '@ethersproject/providers';
import { StakingRewards } from '@popcorn/hardhat/typechain';
import { getERC20Contract, StakingPoolInfo } from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import { updateStakingPageInfo } from 'context/actions';
import { store } from 'context/store';
import router from 'next/router';
import { useCallback, useContext } from 'react';
import MainActionButton from './MainActionButton';
import TokenIcon from './TokenIcon';

interface StakeCardProps {
  tokenName: string;
  stakingPoolInfo: StakingPoolInfo;
  url: string;
  stakingContract: StakingRewards | undefined;
  stakedTokenAddress: string;
  index: number;
}

export default function ({
  tokenName,
  stakingPoolInfo,
  url,
  stakingContract,
  index,
  stakedTokenAddress,
}: StakeCardProps): JSX.Element {
  const { library } = useWeb3React<Web3Provider>();
  const { dispatch } = useContext(store);

  const onSelectPool = useCallback(async () => {
    const erc20 = await getERC20Contract(
      stakingPoolInfo.stakedTokenAddress,
      library,
    );
    dispatch(
      updateStakingPageInfo({
        inputToken: erc20,
        stakingContract: stakingContract,
        tokenName,
        poolInfo: stakingPoolInfo,
      }),
    );
    sessionStorage.setItem('stakingPoolAddress', stakedTokenAddress);
    sessionStorage.setItem('stakingPoolIndex', index.toString());
    router.push(`staking/${url}`);
  }, [
    router,
    getERC20Contract,
    stakingContract,
    tokenName,
    stakingPoolInfo.stakedTokenAddress,
    library,
  ]);

  return (
    <div
      className="bg-white rounded-3xl border border-gray-200 shadow-custom w-full mr-4 p-8 cursor-pointer transform transition duration-150 ease-in-out hover:scale-101"
      onClick={async () => await onSelectPool()}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          <TokenIcon token={tokenName} />
          <h3 className="text-2xl font-medium ml-4 ">{tokenName}</h3>
        </div>
        <div className="w-24">
          <MainActionButton
            label="Stake"
            handleClick={async () => await onSelectPool()}
          />
        </div>
      </div>
      <div className="flex flex-row items-center mt-10 w-2/3 justify-between">
        <div>
          <p className="text-gray-500 font-light uppercase">Est. APY</p>
          <p className="text-green-600 text-2xl font-medium mt-1">
            {stakingPoolInfo.apy.toLocaleString()} %
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-light uppercase">Total Staked</p>
          <p className=" text-2xl font-medium mt-1">
            {stakingPoolInfo.totalStake.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-light uppercase">Token Emissions</p>
          <p className=" text-2xl font-medium mt-1">
            {stakingPoolInfo.tokenEmission.toLocaleString()} POP / day
          </p>
        </div>
      </div>
    </div>
  );
}
