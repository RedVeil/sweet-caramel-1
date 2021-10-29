import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import ClaimableInfo from 'components/ClaimableInfo';
import Navbar from 'components/NavBar/NavBar';
import StakingCard from 'components/StakeCard';
import { Contracts, ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import * as Icon from 'react-feather';
import { Toaster } from 'react-hot-toast';
import { bigNumberToNumber } from '../../utils';
import calculateAPY from '../../utils/src/getStakingReturns';

interface TokenBalances {
  pop: number;
  popEthLp: number;
  butter: number;
}

interface Balances {
  wallet: TokenBalances;
  staked: TokenBalances;
  earned: TokenBalances;
}

async function getWalletBalances(
  account: string,
  contracts: Contracts,
): Promise<TokenBalances> {
  return {
    pop: bigNumberToNumber(await contracts.pop.balanceOf(account)),
    popEthLp: bigNumberToNumber(await contracts.popEthLp.balanceOf(account)),
    butter: bigNumberToNumber(await contracts.butter.balanceOf(account)),
  };
}

async function getStakedBalances(
  account: string,
  contracts: Contracts,
): Promise<TokenBalances> {
  return {
    pop: bigNumberToNumber(await contracts.staking.pop.balanceOf(account)),
    popEthLp: bigNumberToNumber(
      await contracts.staking.popEthLp.balanceOf(account),
    ),
    butter: bigNumberToNumber(
      await contracts.staking.butter.balanceOf(account),
    ),
  };
}

async function getEarned(
  account: string,
  contracts: Contracts,
): Promise<TokenBalances> {
  return {
    pop: bigNumberToNumber(await contracts.staking.pop.earned(account)),
    popEthLp: bigNumberToNumber(
      await contracts.staking.popEthLp.earned(account),
    ),
    butter: bigNumberToNumber(await contracts.staking.butter.earned(account)),
  };
}

async function getBalances(
  account: string,
  contracts: Contracts,
): Promise<Balances> {
  return {
    wallet: await getWalletBalances(account, contracts),
    staked: await getStakedBalances(account, contracts),
    earned: await getEarned(account, contracts),
  };
}

async function getStakingReturns(contracts: Contracts): Promise<TokenBalances> {
  return {
    pop: await calculateAPY(contracts.staking.pop),
    popEthLp: await calculateAPY(contracts.staking.popEthLp),
    butter: await calculateAPY(contracts.staking.butter),
  };
}

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, active } = context;
  const [balances, setBalances] = useState<Balances>();
  const [stakingReturns, setStakingReturns] = useState<TokenBalances>();

  useEffect(() => {
    if (!account || !contracts) {
      return;
    }
    getBalances(account, contracts).then((res) => setBalances(res));
    getStakingReturns(contracts).then((res) => setStakingReturns(res));
  }, [account, contracts]);

  useEffect(() => {
    if (!balances) {
      return;
    }
    balances.earned.pop;
  }, [balances]);

  return (
    <div className="w-full bg-gray-50 h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
        <div className="w-9/12 mx-auto flex flex-row mt-14">
          <div className="w-2/12 space-y-4 mr-20">
            <p className="text-lg font-medium text-gray-800 pl-3 py-3 rounded-md cursor-pointer hover:bg-gray-100 hover:text-gray-900">
              Staking
            </p>
            <p className="text-lg font-medium text-gray-500 pl-3 py-3 rounded-md cursor-pointer hover:bg-gray-100 hover:text-gray-700">
              Coming soon...
            </p>
            <p className="text-lg font-medium text-gray-500 pl-3 py-3 rounded-md cursor-pointer hover:bg-gray-100 hover:text-gray-700">
              Coming soon...
            </p>
          </div>

          <div className="w-9/12">
            <div className="flex flex-row items-center">
              <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center">
                <Icon.Lock className="text-white mx-auto" />
              </div>
              <h1 className="ml-2 text-3xl text-gray-800 font-medium">
                Staking Rewards
              </h1>
            </div>

            <div className="flex flex-row items-center mt-8">
              <ClaimableInfo />
            </div>

            <div className="flex flex-row items-center mt-16">
              {stakingReturns && balances && (
                <>
                  <StakingCard
                    tokenName="POP"
                    apy={stakingReturns.pop}
                    stakedBalance={balances.staked.pop}
                  />
                  <StakingCard
                    tokenName="POP ETH LP"
                    apy={stakingReturns.popEthLp}
                    stakedBalance={balances.staked.popEthLp}
                    url="POP_ETH_LP"
                  />
                  <StakingCard
                    tokenName="BUTTER"
                    apy={stakingReturns.butter}
                    stakedBalance={balances.staked.butter}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
