import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import Navbar from 'components/NavBar/NavBar';
import StakeCard from 'components/StakeCard';
import StatInfoCard from 'components/StatInfoCard';
import { Contracts, ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  getBalances,
  getEarned,
  getStakingStats,
  StakingStats,
} from '../../../utils';

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
  const [stakingStats, setStakingStats] = useState<StakingStats>();

  useEffect(() => {
    if (!contracts) {
      return;
    }
    getStakingStats(contracts).then((res) => setStakingStats(res));
  }, [contracts]);

  useEffect(() => {
    if (!account || !contracts) {
      return;
    }
    getUserBalances(account, contracts).then((res) => setBalances(res));
  }, [account, contracts]);

  return (
    <div className="w-full h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
        <div className="w-9/12 mx-auto flex flex-row mt-14">
          <div className="w-1/3">
            <div className="">
              <h1 className="text-3xl text-gray-800 font-medium">Staking</h1>
              <p className="text-lg text-gray-500">
                Earn more income staking your crypto with us
              </p>
            </div>
            <div className="bg-primaryLight rounded-xl pt-10 mr-12 mt-12">
              <img
                src="/images/farmerCat.svg"
                alt="farmcerCat"
                className="mx-auto"
              />
            </div>
          </div>

          <div className="w-2/3">
            <div className="mt-28 flex flex-row items-center">
              {balances && (
                <>
                  {/*<div className="w-1/2 mr-2">
                    <StatInfoCard
                      title="Staked Balance"
                      content={`${(
                        balances.staked.butter +
                        balances.staked.pop +
                        balances.staked.popEthLp
                      ).toLocaleString()} Token`}
                      icon={{
                        icon: 'Money',
                        color: 'bg-green-200',
                        iconColor: 'text-gray-800',
                      }}
                    />
                    </div>*/}
                  <div className="w-full">
                    <StatInfoCard
                      title="Cumulative Rewards"
                      content={`${(
                        balances.earned.pop +
                        balances.earned.popEthLp +
                        balances.earned.butter
                      ).toLocaleString()} POP`}
                      icon={{ icon: 'Money', color: 'bg-blue-300' }}
                    />
                  </div>
                </>
              )}
            </div>
            <div className={`${balances ? 'mt-8' : ''} space-y-4`}>
              {stakingStats && (
                <>
                  <StakeCard
                    tokenName="POP"
                    stakingStats={stakingStats.pop}
                    url="pop"
                  />
                  <StakeCard
                    tokenName="POP/ETH LP"
                    stakingStats={stakingStats.popEthLp}
                    url="pop-eth-lp"
                  />
                  <StakeCard
                    tokenName="BUTTER"
                    stakingStats={stakingStats.butter}
                    url="butter"
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
