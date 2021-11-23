import { Web3Provider } from '@ethersproject/providers';
import { Switch } from '@headlessui/react';
import { ERC20, StakingRewards } from '@popcorn/hardhat/typechain';
import {
  bigNumberToNumber,
  getSingleStakingPoolInfo,
  StakingPoolInfo,
} from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import TokenInput from 'components/Common/TokenInput';
import MainActionButton from 'components/MainActionButton';
import Navbar from 'components/NavBar/NavBar';
import StatInfoCard from 'components/StatInfoCard';
import TokenIcon from 'components/TokenIcon';
import { updateStakingPageInfo } from 'context/actions';
import { store } from 'context/store';
import { connectors } from 'context/Web3/connectors';
import { ContractsContext } from 'context/Web3/contracts';
import { utils } from 'ethers';
import { useRouter } from 'next/router';
import 'rc-slider/assets/index.css';
import React, { useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export interface StakingPageInfo {
  inputToken: ERC20;
  stakingContract: StakingRewards;
  tokenName: string;
  poolInfo: StakingPoolInfo;
}

interface Balances {
  wallet: number;
  staked: number;
  allowance: number;
  earned: number;
}

// function getStakingInfo(id: string, contracts: Contracts): StakingInfo {
//   switch (id) {

//     //TODO - change here to get the data correctly.
//     case 'pop':
//       return {
//         inputToken: contracts.pop,
//         stakingContract: contracts.staking.pop,
//         tokenName: 'POP',
//       };
//     case 'pop-eth-lp':
//       return {
//         inputToken: contracts.popEthLp,
//         stakingContract: contracts.staking.popEthLp,
//         tokenName: 'POP/ETH LP',
//       };
//     case 'butter':
//       return {
//         inputToken: contracts.butter,
//         stakingContract: contracts.staking.butter,
//         tokenName: 'BUTTER',
//       };
//   }
// }

export default function stake(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, chainId } = context;
  // const [state.stakingPageInfo, setStakingInfo] = useState<StakingInfo>();
  // const [stakingStats, setStakingStats] = useState<StakingPoolInfo>();
  const [inputTokenAmount, setInputTokenAmount] = useState<number>(0);
  const [balances, setBalances] = useState<Balances>({
    wallet: 0,
    staked: 0,
    allowance: 0,
    earned: 0,
  });
  const [apy, setApy] = useState<number>(0);
  const [wait, setWait] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<boolean>(false);
  const { state, dispatch } = useContext(store);
  // useEffect(() => {
  //   if (!state.stakingPageInfo) {
  //     return;
  //   }

  // }, [state.stakingPageInfo]);

  useEffect(() => {
    if (true) {
      // check here if the page reload would work or not and send the user back if not.
    }
  }, []);

  // useEffect(() => {
  //   router.back()
  // }, [chainId])

  // useEffect(() => {
  //   updateData()
  // }, [state.stakingPageInfo.poolInfo.stakedTokenAddress])

  async function updateData(): Promise<void> {
    const inputBalance = await state.stakingPageInfo.inputToken.balanceOf(
      account,
    );
    const allowance = await state.stakingPageInfo.inputToken.allowance(
      account,
      state.stakingPageInfo.stakingContract.address,
    );
    const stakedAmount = await state.stakingPageInfo.stakingContract.balanceOf(
      account,
    );
    const earned = await state.stakingPageInfo.stakingContract.earned(account);
    getSingleStakingPoolInfo(
      state.stakingPageInfo.stakingContract,
      state.stakingPageInfo.poolInfo.stakedTokenAddress,
      state.stakingPageInfo.poolInfo.stakedTokenName,
    )
      .then((res: StakingPoolInfo) => {
        setBalances({
          wallet: bigNumberToNumber(inputBalance),
          staked: bigNumberToNumber(stakedAmount),
          allowance: bigNumberToNumber(allowance),
          earned: bigNumberToNumber(earned),
        });

        const poolInfo = { ...state.stakingPageInfo.poolInfo, res };

        const newStakingPageInfo = {
          ...state.stakingPageInfo,
          poolInfo,
        };
        dispatch(updateStakingPageInfo(newStakingPageInfo));
      })
      .catch(() => {});
  }

  // const apy = await calculateAPY(
  //   await state.stakingPageInfo.stakingContract.getRewardForDuration(),
  //   await state.stakingPageInfo.stakingContract.totalSupply(),
  // );

  async function stake(): Promise<void> {
    setWait(true);
    toast.loading(`Staking ${state.stakingPageInfo.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking =
      await state.stakingPageInfo.stakingContract.connect(signer);
    await connectedStaking
      .stake(lockedPopInEth)
      .then((res) =>
        res.wait().then((res) => {
          {
            toast.dismiss();
            toast.success(`${state.stakingPageInfo.tokenName} staked!`);
          }
        }),
      )
      .catch((err) => {
        if (
          err.message ===
          'MetaMask Tx Signature: User denied transaction signature.'
        ) {
          toast.error('Transaction was canceled');
        } else {
          toast.error(err.message.split("'")[1]);
        }
      });

    await updateData();
    setWait(false);
    setInputTokenAmount(0);
  }

  async function withdrawStake(): Promise<void> {
    setWait(true);
    toast.loading(`Withdrawing ${state.stakingPageInfo.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking =
      await state.stakingPageInfo.stakingContract.connect(signer);
    await connectedStaking
      .withdraw(lockedPopInEth)
      .then((res) =>
        res.wait().then((res) => {
          {
            toast.dismiss();
            toast.success(`${state.stakingPageInfo.tokenName} withdrawn!`);
          }
        }),
      )
      .catch((err) => {
        if (
          err.message ===
          'MetaMask Tx Signature: User denied transaction signature.'
        ) {
          toast.error('Transaction was canceled');
        } else {
          toast.error(err.message.split("'")[1]);
        }
      });
    await updateData();
    setWait(false);
    setInputTokenAmount(0);
  }

  async function approve(): Promise<void> {
    setWait(true);
    toast.loading(
      `Approving ${state.stakingPageInfo.tokenName} for staking...`,
    );

    // Ensure that inputTokenAmount is in the format 10000000... instead of 10e+5
    // because parseEther breaks with exponential String
    const formattedToken = inputTokenAmount.toLocaleString().replace(/,/gi, '');
    const lockedTokenInEth = utils.parseEther(formattedToken);
    const connected = await contracts.pop.connect(library.getSigner());
    await connected
      .approve(state.stakingPageInfo.stakingContract.address, lockedTokenInEth)
      .then((res) =>
        res.wait().then((res) => {
          toast.dismiss();
          toast.success(`${state.stakingPageInfo.tokenName} approved!`);
        }),
      )
      .catch((err) => {
        if (
          err.message ===
          'MetaMask Tx Signature: User denied transaction signature.'
        ) {
          toast.error('Transaction was canceled');
        } else {
          toast.error(err.message.split("'")[1]);
        }
      });
    await updateData();
    setWait(false);
  }

  return (
    <>
      <div
        className="overflow-hidden"
        style={{ width: '100vw', height: '90vh' }}
      >
        <Navbar />
        <Toaster position="top-right" />
        <div className="w-9/12 mx-auto ">
          <div className="flex flex-row mt-14">
            <div className="w-1/3 mr-8">
              <div className="">
                {state.stakingPageInfo && (
                  <span className="flex flex-row items-center">
                    <TokenIcon token={state.stakingPageInfo.tokenName} />
                    <h1 className="ml-3 text-4xl text-gray-800 font-bold">
                      {state.stakingPageInfo.tokenName}
                    </h1>
                  </span>
                )}
                <div className="flex flex-row items-center mt-6 justify-between">
                  <div className="pr-8 border-r-2 border-gray-300">
                    <p className="text-gray-500 font-medium uppercase">
                      Est. APY
                    </p>
                    <p className="text-green-600 text-xl font-medium">
                      {state.stakingPageInfo.poolInfo
                        ? state.stakingPageInfo.poolInfo.apy.toLocaleString()
                        : 0}{' '}
                      %
                    </p>
                  </div>
                  <div className="pr-8 border-r-2 border-gray-300">
                    <p className="text-gray-500 font-medium uppercase">
                      Total Staked
                    </p>
                    <p className="text-gray-800 text-xl font-medium">
                      {state.stakingPageInfo.poolInfo
                        ? state.stakingPageInfo.poolInfo.totalStake.toLocaleString()
                        : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium uppercase">
                      Token Emissions
                    </p>
                    <p className="text-gray-800 text-xl font-medium">
                      {state.stakingPageInfo.poolInfo
                        ? state.stakingPageInfo.poolInfo.tokenEmission.toLocaleString()
                        : 0}{' '}
                      POP / day
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 py-14 px-6 border border-gray-300 rounded-xl">
                <div className="flex flex-col">
                  {state.stakingPageInfo && (
                    <TokenInput
                      tokenName={state.stakingPageInfo.tokenName}
                      inputAmount={inputTokenAmount}
                      balance={withdraw ? balances.staked : balances.wallet}
                      updateInputAmount={setInputTokenAmount}
                    />
                  )}
                  <Switch.Group as="div" className="flex mt-2">
                    <Switch
                      checked={withdraw}
                      onChange={setWithdraw}
                      className={`
                              ${withdraw ? 'bg-indigo-600' : 'bg-gray-200'}
                              relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          withdraw ? 'translate-x-5' : 'translate-x-0'
                        }
                                pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </Switch>
                    <Switch.Label as="span" className="ml-3">
                      <span
                        className={`text-sm font-medium ${
                          withdraw ? 'text-gray-800' : 'text-gray-500'
                        }`}
                      >
                        Withdraw Staked{' '}
                        {state.stakingPageInfo &&
                          state.stakingPageInfo.tokenName}
                      </span>
                    </Switch.Label>
                  </Switch.Group>
                </div>
                {state.stakingPageInfo && (
                  <div className="mt-16 w-96 mx-auto">
                    {account ? (
                      <>
                        {withdraw ? (
                          <MainActionButton
                            label={`Withdraw ${state.stakingPageInfo.tokenName}`}
                            handleClick={withdrawStake}
                            disabled={wait || balances.staked === 0}
                          />
                        ) : (
                          <>
                            {balances.allowance >= inputTokenAmount ? (
                              <MainActionButton
                                label={'Stake POP'}
                                handleClick={stake}
                                disabled={wait || inputTokenAmount === 0}
                              />
                            ) : (
                              <MainActionButton
                                label={'Approve'}
                                handleClick={approve}
                                disabled={wait || inputTokenAmount === 0}
                              />
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <MainActionButton
                        label={'Connect Wallet'}
                        handleClick={() => activate(connectors.Injected)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="w-2/3">
              <div className="mt-36 space-y-4">
                {balances && state.stakingPageInfo && (
                  <>
                    <div className="flex flex-row items-center">
                      <div className="w-1/2 mr-2">
                        <StatInfoCard
                          title="Token Balance"
                          content={`${balances.wallet.toLocaleString()} ${
                            state.stakingPageInfo.tokenName
                          }`}
                          icon={{
                            icon: 'Money',
                            color: 'bg-yellow-200',
                            iconColor: 'text-gray-800',
                          }}
                        />
                      </div>
                      <div className="w-1/2 ml-2">
                        <StatInfoCard
                          title="Amount Staked"
                          content={`${balances.staked.toLocaleString()} ${
                            state.stakingPageInfo.tokenName
                          }`}
                          icon={{
                            icon: 'Money',
                            color: 'bg-red-300',
                            iconColor: 'text-gray-800',
                          }}
                        />
                      </div>
                    </div>
                    <div className="bg-primaryLight rounded-md border border-gray-300 w-full">
                      <div className="flex flex-row items-center justify-between">
                        <div className="relative h-60 w-full pt-4">
                          <p className="text-xl font-medium ml-12 mt-4">
                            Happy Staking
                          </p>
                          <p className="ml-12 text-base font-light w-3/12">
                            Enjoy more sweet POP in your wallet!
                          </p>
                          <img
                            src="/images/catPopVault.png"
                            className="absolute h-52 w-9/12 right-20 bottom-0"
                          />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
