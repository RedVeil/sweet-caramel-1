import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import Navbar from 'components/NavBar/NavBar';
import { Contracts, ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { bigNumberToNumber, getStakingPoolsInfo } from '../../../utils';
import StakingCardsList from '../../components/StakingCardsList';

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

// TODO get oracles for popETH-LP and butter price to display the joined value of all staked tokens
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
    getStakingPoolsInfo(contracts, library).then((res) => {
      setStakingPools(res);
    });
  }, [chainId, contracts]);

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
              <p className="text-lg text-gray-500 mt-2">
                Earn more income staking your crypto with us
              </p>
            </div>
            <div className="bg-primaryLight rounded-5xl pt-44 pb-44 mr-12 mt-10 shadow-custom">
              <img
                src="/images/farmerCat.svg"
                alt="farmcerCat"
                className="mx-auto transform scale-101 py-1"
              />
            </div>
          </div>

          <div className="w-2/3 mt-28">
            <div className={`space-y-6`}>
              {stakingPoolsInfo && (
                <StakingCardsList stakingPoolsInfo={stakingPoolsInfo} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
