import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import Navbar from 'components/NavBar/NavBar';
import StakeClaimCard from 'components/StakeClaimCard';
import { Contracts, ContractsContext } from 'context/Web3/contracts';
import router from 'next/router';
import { useContext, useEffect, useState } from 'react';
import * as Icon from 'react-feather';
import { Toaster } from 'react-hot-toast';
import {
  getBalances,
  getEarned,
  getStakingReturns,
  TokenBalances,
} from '../../../utils/src';
interface Balances {
  wallet: TokenBalances;
  staked: TokenBalances;
  earned: TokenBalances;
}

async function getUserBalances(
  account: string,
  contracts: Contracts,
): Promise<Balances> {
  return {
    wallet: await getBalances(account, {
      pop: contracts.pop,
      popEthLp: contracts.popEthLp,
      butter: contracts.butter,
    }),
    staked: await getBalances(account, {
      pop: contracts.staking.pop,
      popEthLp: contracts.staking.popEthLp,
      butter: contracts.staking.butter,
    }),
    earned: await getEarned(account, contracts),
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
    getUserBalances(account, contracts).then((res) => setBalances(res));
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
                Staking
              </h1>
            </div>

            <div className="flex flex-row items-center mt-16">
              {stakingReturns && balances && (
                <>
                  <StakeClaimCard
                    title="POP Staking"
                    icon={{ color: 'bg-pink-400', icon: 'Lock' }}
                    infos={[
                      {
                        title: 'APY',
                        info: `${stakingReturns.pop.toLocaleString()} %`,
                      },
                      {
                        title: 'Your Stake',
                        info: `${balances.staked.pop.toLocaleString()} POP`,
                      },
                    ]}
                    buttonLabel="Select"
                    handleClick={() => router.push('/staking/POP')}
                  />
                  <StakeClaimCard
                    title="POP-ETH LP Staking"
                    icon={{ color: 'bg-pink-400', icon: 'Lock' }}
                    infos={[
                      {
                        title: 'APY',
                        info: `${stakingReturns.popEthLp.toLocaleString()} %`,
                      },
                      {
                        title: 'Your Stake',
                        info: `${balances.staked.pop.toLocaleString()} POP-ETH`,
                      },
                    ]}
                    buttonLabel="Select"
                    handleClick={() => router.push('/staking/POP_ETH_LP')}
                  />
                  <StakeClaimCard
                    title="BUTTER Staking"
                    icon={{ color: 'bg-pink-400', icon: 'Lock' }}
                    infos={[
                      {
                        title: 'APY',
                        info: `${stakingReturns.butter.toLocaleString()} %`,
                      },
                      {
                        title: 'Your Stake',
                        info: `${balances.staked.butter.toLocaleString()} BUTTER`,
                      },
                    ]}
                    buttonLabel="Select"
                    handleClick={() => router.push('/staking/BUTTER')}
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
