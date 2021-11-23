import { Web3Provider } from '@ethersproject/providers';
import { StakingPoolInfo } from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import { updateStakingPageInfo } from 'context/actions';
import { store } from 'context/store';
import router from 'next/router';
import { useCallback, useContext } from 'react';
import { ERC20, ERC20__factory, StakingRewards } from '../../hardhat/typechain';
import TokenIcon from './TokenIcon';

interface StakeCardProps {
  tokenName: string;
  stakingPoolInfo: StakingPoolInfo;
  url: string;
  stakingContract: StakingRewards | undefined;
}

export default function ({
  tokenName,
  stakingPoolInfo,
  url,
  stakingContract,
}: StakeCardProps): JSX.Element {
  const { library } = useWeb3React<Web3Provider>();
  const { dispatch } = useContext(store);
  const getERC20Contract = useCallback(async (): Promise<ERC20> => {
    const contract: ERC20 = await ERC20__factory.connect(
      stakingPoolInfo.stakedTokenAddress,
      library,
    );
    return contract;
  }, [stakingPoolInfo.stakedTokenAddress, library]);

  const onSelectPool = useCallback(async () => {
    const erc20 = await getERC20Contract();
    dispatch(
      updateStakingPageInfo({
        inputToken: erc20,
        stakingContract: stakingContract,
        tokenName,
        poolInfo: stakingPoolInfo,
      }),
    );
    router.push(`staking/${url}`);
  }, [router, getERC20Contract, stakingContract, tokenName]);

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
          onClick={async () => await onSelectPool()}
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
            {stakingPoolInfo.apy.toLocaleString()} %
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-base font-medium uppercase">
            Total Staked
          </p>
          <p className="text-gray-800 text-xl font-medium">
            {stakingPoolInfo.totalStake.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-base font-medium uppercase">
            Token Emissions
          </p>
          <p className="text-gray-800 text-xl font-medium">
            {stakingPoolInfo.tokenEmission.toLocaleString()} POP / day
          </p>
        </div>
      </div>
    </div>
  );
}
