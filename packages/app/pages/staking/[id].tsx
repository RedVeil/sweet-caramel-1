import { Web3Provider } from '@ethersproject/providers';
import { ERC20, StakingRewards } from '@popcorn/hardhat/typechain';
import {
  bigNumberToNumber,
  getERC20Contract,
  getSingleStakingPoolInfo,
  StakingPoolInfo,
} from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import TokenInput from 'components/Common/TokenInput';
import MainActionButton from 'components/MainActionButton';
import Navbar from 'components/NavBar/NavBar';
import TokenIcon from 'components/TokenIcon';
import TokenInputToggle from 'components/TokenInputToggle';
import { updateStakingPageInfo } from 'context/actions';
import { store } from 'context/store';
import { connectors } from 'context/Web3/connectors';
import { ContractsContext } from 'context/Web3/contracts';
import { utils } from 'ethers';
import Link from 'next/link';
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

export default function stake(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, chainId } = context;
  const [inputTokenAmount, setInputTokenAmount] = useState<number>(0);
  const [balances, setBalances] = useState<Balances>({
    wallet: 0,
    staked: 0,
    allowance: 0,
    earned: 0,
  });
  const [wait, setWait] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<boolean>(false);
  const { state, dispatch } = useContext(store);
  const prevChainId = React.useRef<number>(null);

  useEffect(() => {
    if (prevChainId.current && chainId !== prevChainId.current) {
      router.push('/staking');
    }
    prevChainId.current = chainId;
  }, [chainId]);

  useEffect(() => {
    return () => {
      dispatch(updateStakingPageInfo(undefined));
    };
  }, []);

  useEffect(() => {
    if (!library || !contracts || !chainId) {
      return;
    }
    async function getPageInfo() {
      if (contracts && contracts.staking.length > 0) {
        const stakingContract: StakingRewards = contracts.staking.find(
          (contract) => contract.address === id,
        );
        // This would never get called as the getPageInfo function wont get triggered properly on changing the chain when on stake/id page as the stakingPoolInfo variable would still exist.
        // This also cannot be conditional as the pool on differect chains might be very different from each other in future.
        if (stakingContract === undefined) {
          router.push('/staking');
          return;
        }
        const stakingPoolInfo: StakingPoolInfo = await getSingleStakingPoolInfo(
          stakingContract,
          library,
        );
        const erc20 = await getERC20Contract(
          stakingPoolInfo.stakedTokenAddress,
          library,
        );
        const tokenName = await erc20.name();
        dispatch(
          updateStakingPageInfo({
            inputToken: erc20,
            stakingContract: stakingContract,
            tokenName,
            poolInfo: stakingPoolInfo,
          }),
        );
        if (account) {
          await updateDataOnRefresh(erc20, stakingContract);
        }
      }
    }
    if (
      !state.stakingPageInfo ||
      state.stakingPageInfo?.poolInfo?.stakingContractAddress !== id
    ) {
      getPageInfo();
    }
  }, [state.stakingPageInfo, contracts, library, account]);

  const updateDataOnRefresh = async (stakedToken, stakingContract) => {
    const inputBalance = await stakedToken.balanceOf(account);
    const allowance = await stakedToken.allowance(
      account,
      stakingContract?.address,
    );
    const stakedAmount = await stakingContract?.balanceOf(account);
    const earned = await stakingContract?.earned(account);

    setBalances({
      wallet: bigNumberToNumber(inputBalance),
      staked: bigNumberToNumber(stakedAmount),
      allowance: bigNumberToNumber(allowance),
      earned: bigNumberToNumber(earned),
    });
  };

  async function updateData(): Promise<void> {
    const inputBalance = await state.stakingPageInfo?.inputToken.balanceOf(
      account,
    );
    const allowance = await state.stakingPageInfo?.inputToken.allowance(
      account,
      state.stakingPageInfo?.stakingContract?.address,
    );
    const stakedAmount =
      await state.stakingPageInfo?.stakingContract?.balanceOf(account);
    const earned = await state.stakingPageInfo?.stakingContract?.earned(
      account,
    );
    getSingleStakingPoolInfo(
      state.stakingPageInfo?.stakingContract,
      library,
      state.stakingPageInfo?.poolInfo.stakedTokenAddress,
      state.stakingPageInfo?.poolInfo.stakedTokenName,
    )
      .then((res: StakingPoolInfo) => {
        setBalances({
          wallet: bigNumberToNumber(inputBalance),
          staked: bigNumberToNumber(stakedAmount),
          allowance: bigNumberToNumber(allowance),
          earned: bigNumberToNumber(earned),
        });

        const poolInfo = { ...state.stakingPageInfo?.poolInfo, res };

        const newStakingPageInfo = {
          ...state.stakingPageInfo,
          poolInfo,
        };
        dispatch(updateStakingPageInfo(newStakingPageInfo));
      })
      .catch(() => {});
  }

  async function stake(): Promise<void> {
    setWait(true);
    toast.loading(`Staking ${state.stakingPageInfo?.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking =
      await state.stakingPageInfo?.stakingContract?.connect(signer);
    await connectedStaking
      .stake(lockedPopInEth)
      .then((res) =>
        res.wait().then((res) => {
          {
            toast.dismiss();
            toast.success(`${state.stakingPageInfo?.tokenName} staked!`);
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
    toast.loading(`Withdrawing ${state.stakingPageInfo?.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking =
      await state.stakingPageInfo?.stakingContract?.connect(signer);
    await connectedStaking
      .withdraw(lockedPopInEth)
      .then((res) =>
        res.wait().then((res) => {
          {
            toast.dismiss();
            toast.success(`${state.stakingPageInfo?.tokenName} withdrawn!`);
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
      `Approving ${state.stakingPageInfo?.tokenName} for staking...`,
    );

    // Ensure that inputTokenAmount is in the format 10000000... instead of 10e+5
    // because parseEther breaks with exponential String
    const formattedToken = inputTokenAmount.toLocaleString().replace(/,/gi, '');
    const lockedTokenInEth = utils.parseEther(formattedToken);
    const connected = await contracts.pop.connect(library.getSigner());
    await connected
      .approve(
        state.stakingPageInfo?.stakingContract?.address,
        lockedTokenInEth,
      )
      .then((res) =>
        res.wait().then((res) => {
          toast.dismiss();
          toast.success(`${state.stakingPageInfo?.tokenName} approved!`);
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
        <div className="lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto ">
          <div className="w-5/12 laptop:w-1/3">
            {state.stakingPageInfo && (
              <span className="flex flex-row items-center">
                <TokenIcon token={state.stakingPageInfo?.tokenName} />
                <h1 className="ml-3 text-4xl  font-bold">
                  {state.stakingPageInfo?.tokenName}
                </h1>
              </span>
            )}
            <div className="flex flex-row items-center mt-6 justify-between">
              <div className="pr-2 smlaptop:pr-8 border-r-2 border-gray-200">
                <p className="text-gray-500 font-light text-base uppercase">
                  Est. APY
                </p>
                <p className="text-green-600 text-xl font-medium">
                  {state.stakingPageInfo?.poolInfo
                    ? state.stakingPageInfo?.poolInfo.apy.toLocaleString()
                    : 0}{' '}
                  %
                </p>
              </div>
              <div className="pr-2 smlaptop:pr-8 border-r-2 border-gray-200">
                <p className="text-gray-500 font-light text-base uppercase">
                  Total Staked
                </p>
                <p className=" text-xl font-medium">
                  {state.stakingPageInfo?.poolInfo
                    ? state.stakingPageInfo?.poolInfo.totalStake.toLocaleString()
                    : 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-light text-base uppercase">
                  Emission Rate
                </p>
                <p className="text-xl font-medium">
                  {state.stakingPageInfo?.poolInfo
                    ? state.stakingPageInfo?.poolInfo.tokenEmission.toLocaleString()
                    : 0}{' '}
                  POP / day
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-row mt-10">
            <div className="w-1/3 pt-8 pb-14 px-6 border border-gray-200 rounded-3xl shadow-custom">
              <div className="pt-2">
                <TokenInputToggle
                  toggled={withdraw}
                  toggle={setWithdraw}
                  labels={['Stake', 'Unstake']}
                />
              </div>
              <div className="py-24">
                {state.stakingPageInfo && (
                  <TokenInput
                    label={withdraw ? 'Unstake Amount' : 'Stake Amount'}
                    tokenName={state.stakingPageInfo?.tokenName}
                    inputAmount={inputTokenAmount}
                    balance={withdraw ? balances.staked : balances.wallet}
                    updateInputAmount={setInputTokenAmount}
                  />
                )}
              </div>
              {state.stakingPageInfo && (
                <div className="w-1/2 min-w-1/3 mx-auto pb-1">
                  {account ? (
                    <>
                      {withdraw ? (
                        <MainActionButton
                          label={`Withdraw ${state.stakingPageInfo?.tokenName}`}
                          handleClick={withdrawStake}
                          disabled={wait || balances.staked === 0}
                        />
                      ) : (
                        <>
                          {balances.allowance >= inputTokenAmount ? (
                            <MainActionButton
                              label={`Stake ${state.stakingPageInfo?.tokenName}`}
                              handleClick={stake}
                              disabled={wait || inputTokenAmount === 0}
                            />
                          ) : (
                            <MainActionButton
                              label={'Approve for Staking'}
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

            <div className="w-2/3 ml-12">
              {balances && state.stakingPageInfo && (
                <>
                  <div className="rounded-3xl shadow-custom border border-gray-200 w-full">
                    <div className="h-28 pt-8 px-8">
                      <div className="flex flex-row items-center justify-between">
                        <div>
                          <h2 className="text-gray-500">Your Staked Balance</h2>
                          <div className="flex flex-row items-center mt-1">
                            <p className="text-2xl font-medium  mr-2">
                              {balances.staked}
                            </p>
                            <p className="text-2xl font-medium ">
                              {state.stakingPageInfo?.tokenName}
                            </p>
                          </div>
                        </div>
                        <div>
                          {/* <Link href="#" passHref>
                              <a
                                target="_blank"
                                className="text-lg text-blue-600 font-medium bg-white px-6 py-3 border border-gray-200 rounded-full hover:text-white hover:bg-blue-500"
                              >
                                Get Token
                              </a>
                            </Link> */}
                        </div>
                      </div>
                    </div>
                    <div className="h-28 bg-blue-50 rounded-b-3xl py-8 px-8">
                      <div className="flex flex-row items-center justify-between">
                        <div>
                          <h2 className="text-gray-500">
                            Your Staking Rewards
                          </h2>
                          <div className="flex flex-row items-center mt-1">
                            <p className="text-2xl font-medium  mr-2">
                              {balances.earned}
                            </p>
                            <p className="text-2xl font-medium ">POP</p>
                          </div>
                        </div>
                        <div>
                          <Link href="/rewards" passHref>
                            <a className="text-lg text-blue-600 font-medium bg-white px-6 py-3 border border-gray-200 rounded-full hover:text-white hover:bg-blue-500">
                              Go to Claim Page
                            </a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primaryLight rounded-3xl shadow-custom border border-gray-200 w-full mt-8">
                    <div className="flex flex-row items-center justify-between">
                      <div className="relative h-56 w-full">
                        <div className="mt-8 ml-8">
                          <p className="text-xl font-medium">Happy Staking</p>
                          <p className="text-base font-light w-3/12 mt-1">
                            Enjoy more sweet POP in your wallet!
                          </p>
                        </div>
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
    </>
  );
}
