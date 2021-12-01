import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import Navbar from 'components/NavBar/NavBar';
import StatInfoCard from 'components/StatInfoCard';
import { Contracts, ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { bigNumberToNumber, getStakingPoolsInfo } from '../../../utils';
import StakingCardsList from './StakingCardsList';

interface TokenBalances {
  pop: number;
  popEthLp: number;
  butter: number;
}

interface Balances {
  wallet: TokenBalances;
  staked?: TokenBalances;
  earned: number;
}

async function getWalletBalances(
  account: string,
  contracts: Contracts,
): Promise<TokenBalances> {
  return {
    pop: contracts.pop
      ? bigNumberToNumber(await contracts.pop.balanceOf(account))
      : 0,
    popEthLp: contracts.popEthLp
      ? bigNumberToNumber(await contracts.popEthLp.balanceOf(account))
      : 0,
    butter: contracts.butter
      ? bigNumberToNumber(await contracts.butter.balanceOf(account))
      : 0,
  };
}

// async function getStakedBalances(
//   account: string,
//   contracts: Contracts,
// ): Promise<TokenBalances> {
//   return {
//     pop: bigNumberToNumber(await contracts.staking.pop.balanceOf(account)),
//     popEthLp: bigNumberToNumber(
//       await contracts.staking.popEthLp.balanceOf(account),
//     ),
//     butter: bigNumberToNumber(
//       await contracts.staking.butter.balanceOf(account),
//     ),
//   };
// }

async function getEarned(
  account: string,
  contracts: Contracts,
): Promise<number> {
  let earned = 0;
  for (var i = 0; i < contracts.staking?.length; i++) {
    earned += bigNumberToNumber(await contracts.staking[i].earned(account));
  }
  return earned;
}

async function getBalances(
  account: string,
  contracts: Contracts,
): Promise<Balances> {
  return {
    wallet: await getWalletBalances(account, contracts),
    // staked: await getStakedBalances(account, contracts),
    earned: await getEarned(account, contracts),
  };
}

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, active, chainId } = context;
  const [balances, setBalances] = useState<Balances>();
  const [stakingPoolsInfo, setStakingPools] = useState<any>();

  useEffect(() => {
    if (!chainId) {
      return;
    }
    getStakingPoolsInfo(contracts, library)
      .then((res) => {
        setStakingPools(res);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [contracts]);

  useEffect(() => {
    if (!account || !contracts) {
      return;
    }
    getBalances(account, contracts).then((res) => setBalances(res));
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
                      content={`${balances?.earned?.toLocaleString()} POP`}
                      icon={{ icon: 'Money', color: 'bg-blue-300' }}
                    />
                  </div>
                </>
              )}
            </div>
            <div className={`${balances ? 'mt-8' : ''} space-y-4`}>
              {stakingPoolsInfo !== undefined ? (
                <StakingCardsList stakingPoolsInfo={stakingPoolsInfo} />
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
