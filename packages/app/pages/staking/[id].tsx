import { Web3Provider } from '@ethersproject/providers';
import { ERC20, PopLocker, Staking } from '@popcorn/hardhat/typechain';
import {
  bigNumberToNumber,
  getEarned,
  getERC20Contract,
  getSingleStakingPoolInfo,
  StakingPoolInfo,
} from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import TokenInput from 'components/Common/TokenInput';
import MainActionButton from 'components/MainActionButton';
import Navbar from 'components/NavBar/NavBar';
import TermsAndConditions from 'components/StakingTermsAndConditions';
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
  stakingContract: Staking | PopLocker;
  tokenName: string;
  symbol: string;
  poolInfo: StakingPoolInfo;
}

interface Balances {
  wallet: number;
  staked: number;
  allowance: number;
  earned: number;
  withdrawable: number;
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
    withdrawable: 0,
  });
  const [wait, setWait] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const { state, dispatch } = useContext(store);
  const prevChainId = React.useRef<number>(null);

  useEffect(() => {
    if (prevChainId.current && chainId !== prevChainId.current && chainId) {
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
        const stakingContract: Staking | PopLocker = [
          contracts.popStaking,
          ...contracts.staking,
        ].find((contract) => contract.address === id);
        // This would never get called as the getPageInfo function wont get triggered properly on changing the chain when on stake/id page as the stakingPoolInfo variable would still exist.
        // This also cannot be conditional as the pool on differect chains might be very different from each other in future.
        if (stakingContract === undefined) {
          router.push('/staking');
          return;
        }
        const stakingPoolInfo: StakingPoolInfo = await getSingleStakingPoolInfo(
          stakingContract,
          library,
          id === contracts.popStaking.address ? contracts.pop.address : null,
          id === contracts.popStaking.address ? 'POP' : null,
        );
        const erc20 = await getERC20Contract(
          stakingPoolInfo.stakedTokenAddress,
          library,
        );
        dispatch(
          updateStakingPageInfo({
            inputToken: erc20,
            stakingContract: stakingContract,
            tokenName: await erc20.name(),
            symbol: await erc20.symbol(),
            poolInfo: stakingPoolInfo,
          }),
        );
        if (account) {
          await updateBalances(erc20, stakingContract);
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

  const updateBalances = async (stakedToken, stakingContract) => {
    const inputBalance = await stakedToken.balanceOf(account);
    const allowance = await stakedToken.allowance(
      account,
      stakingContract?.address,
    );
    const stakedAmount =
      id === contracts.popStaking.address
        ? await (stakingContract as PopLocker)?.lockedBalanceOf(account)
        : await (stakingContract as Staking)?.balanceOf(account);
    const earned = await getEarned(
      stakingContract,
      account,
      id === contracts.popStaking.address,
    );
    const withdrawable =
      id === contracts.popStaking.address
        ? await (
            await (stakingContract as PopLocker).lockedBalances(account)
          ).unlockable
        : stakedAmount;

    setBalances({
      wallet: bigNumberToNumber(inputBalance),
      staked: bigNumberToNumber(stakedAmount),
      allowance: bigNumberToNumber(allowance),
      earned: bigNumberToNumber(earned),
      withdrawable: bigNumberToNumber(withdrawable),
    });
  };

  async function updateData(): Promise<void> {
    await updateBalances(
      state?.stakingPageInfo?.inputToken,
      state?.stakingPageInfo?.stakingContract,
    );

    const stakingPoolInfo = await getSingleStakingPoolInfo(
      state.stakingPageInfo?.stakingContract,
      library,
      state.stakingPageInfo?.poolInfo.stakedTokenAddress,
      state.stakingPageInfo?.poolInfo.stakedTokenName,
    );
    dispatch(
      updateStakingPageInfo({
        inputToken: state.stakingPageInfo.inputToken,
        stakingContract: state.stakingPageInfo.stakingContract,
        tokenName: state.stakingPageInfo.tokenName,
        symbol: state.stakingPageInfo.symbol,
        poolInfo: stakingPoolInfo,
      }),
    );
  }

  async function stake(): Promise<void> {
    setWait(true);
    toast.loading(`Staking ${state.stakingPageInfo?.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking =
      await state.stakingPageInfo.stakingContract.connect(signer);
    const stakeCall =
      id === contracts.popStaking.address
        ? (connectedStaking as PopLocker).lock(account, lockedPopInEth, 0)
        : (connectedStaking as Staking).stake(lockedPopInEth);
    await stakeCall
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
      await state.stakingPageInfo.stakingContract.connect(signer);

    const call =
      id === contracts.popStaking.address
        ? (connectedStaking as PopLocker)['processExpiredLocks(bool)'](false)
        : (connectedStaking as Staking).withdraw(lockedPopInEth);

    await call
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

  async function restake(): Promise<void> {
    setWait(true);
    toast.loading(`Restaking POP...`);
    const signer = library.getSigner();
    const connectedStaking =
      await state.stakingPageInfo.stakingContract.connect(signer);

    await (connectedStaking as PopLocker)
      ['processExpiredLocks(bool)'](true)
      .then((res) =>
        res.wait().then((res) => {
          {
            toast.dismiss();
            toast.success(`Restaked POP!`);
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
        res.wait().then(async (res) => {
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
          console.log(err);
          console.log(err.message);
          toast.error(err.message.split("'")[1]);
        }
      });
    await updateData();
    setWait(false);
  }

  return (
    <>
      <div className="overflow-hidden" style={{ width: '100vw' }}>
        <Navbar />
        <Toaster position="top-right" />
        <div className="lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto pb-28">
          <div className="w-2/3 mt-14">
            <div className="">
              {state.stakingPageInfo && (
                <span className="flex flex-row items-center">
                  <TokenIcon token={state.stakingPageInfo?.tokenName} />
                  <h1 className="ml-3 text-4xl font-bold">
                    {state.stakingPageInfo?.tokenName}
                  </h1>
                </span>
              )}
              <div className="w-1/2 flex flex-row items-center mt-6 justify-between">
                <div className="pr-8 border-r-2 border-gray-200">
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
                <div className="pr-8 border-r-2 border-gray-200">
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
                  <p className=" text-xl font-medium">
                    {state.stakingPageInfo?.poolInfo
                      ? state.stakingPageInfo?.poolInfo.tokenEmission.toLocaleString()
                      : 0}{' '}
                    POP / day
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row mt-10">
            <div className="w-1/3">
              <div className="pt-8 pb-14 px-6 border border-gray-200 rounded-3xl shadow-custom">
                <div className="pt-2">
                  <TokenInputToggle
                    toggled={withdraw}
                    toggle={setWithdraw}
                    labels={['Stake', 'Unstake']}
                  />
                </div>
                <div className="pt-16 pb-10">
                  {state.stakingPageInfo && (
                    <>
                      {state?.stakingPageInfo?.symbol === 'POP' && withdraw ? (
                        <div className="w-96 mx-auto">
                          <div className="w-full mb-10">
                            <span className="flex flex-col justify-between">
                              <div className="">
                                <div>
                                  <label
                                    htmlFor="tokenInput"
                                    className="flex justify-between text-sm font-medium text-gray-700 text-center"
                                  >
                                    <p className="mb-2  text-base">
                                      Withdrawable Amount
                                    </p>
                                  </label>
                                  <div className="mt-1 relative flex items-center">
                                    <input
                                      type="number"
                                      name="tokenInput"
                                      id="tokenInput"
                                      className="shadow-sm block w-full pl-4 pr-16 py-4 text-lg border-gray-300 bg-gray-100 rounded-xl"
                                      value={balances.withdrawable}
                                      disabled
                                    />
                                    <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                                      <p className="inline-flex items-center  font-medium text-lg mx-3">
                                        POP
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </span>
                          </div>
                          <div className="flex flex-row items-center space-x-4">
                            <MainActionButton
                              label={'Restake'}
                              handleClick={() => restake()}
                              disabled={
                                wait || balances.withdrawable === 0 || !account
                              }
                            />
                            <MainActionButton
                              label={`Withdraw ${state.stakingPageInfo?.symbol}`}
                              handleClick={withdrawStake}
                              disabled={wait || balances.withdrawable === 0}
                            />
                          </div>
                        </div>
                      ) : (
                        <TokenInput
                          label={withdraw ? 'Unstake Amount' : 'Stake Amount'}
                          tokenName={state.stakingPageInfo?.symbol}
                          inputAmount={inputTokenAmount}
                          balance={withdraw ? balances.staked : balances.wallet}
                          updateInputAmount={setInputTokenAmount}
                        />
                      )}
                    </>
                  )}
                </div>

                {state.stakingPageInfo && (
                  <div>
                    {account ? (
                      <>
                        {withdraw ? (
                          <div></div>
                        ) : (
                          <>
                            {balances.allowance >= inputTokenAmount ? (
                              <TermsAndConditions
                                isDisabled={false}
                                termsAccepted={termsAccepted}
                                setTermsAccepted={setTermsAccepted}
                                showLockTerms={
                                  state?.stakingPageInfo?.symbol === 'POP'
                                }
                              />
                            ) : (
                              <TermsAndConditions
                                isDisabled={true}
                                termsAccepted={termsAccepted}
                                setTermsAccepted={setTermsAccepted}
                                showLockTerms={
                                  state?.stakingPageInfo?.symbol === 'POP'
                                }
                              />
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {withdraw ? (
                          <div></div>
                        ) : (
                          <TermsAndConditions
                            isDisabled={true}
                            termsAccepted={termsAccepted}
                            setTermsAccepted={setTermsAccepted}
                            showLockTerms={
                              state?.stakingPageInfo?.symbol === 'POP'
                            }
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

                {state.stakingPageInfo && (
                  <div className="w-96 mx-auto pt-4 pb-1">
                    {account ? (
                      <>
                        {withdraw ? (
                          <>
                            {state?.stakingPageInfo?.symbol === 'POP' ? (
                              <></>
                            ) : (
                              <MainActionButton
                                label={`Withdraw ${state.stakingPageInfo?.symbol}`}
                                handleClick={withdrawStake}
                                disabled={wait || balances.withdrawable === 0}
                              />
                            )}
                          </>
                        ) : (
                          <>
                            {balances.allowance >= inputTokenAmount ? (
                              <MainActionButton
                                label={`Stake ${state.stakingPageInfo?.symbol}`}
                                handleClick={stake}
                                disabled={
                                  !termsAccepted ||
                                  inputTokenAmount === 0 ||
                                  wait
                                }
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
            </div>
            <div className="w-2/3 ml-12">
              <div className="">
                {balances && state.stakingPageInfo && (
                  <>
                    <div className="rounded-3xl shadow-custom border border-gray-200 w-full">
                      <div className="h-28 pt-8 px-8">
                        <div className="flex flex-row items-center justify-between">
                          <div>
                            <h2 className="text-gray-500">
                              Your Staked Balance
                            </h2>
                            <div className="flex flex-row items-center mt-1">
                              <p className="text-2xl font-medium  mr-2">
                                {balances.staked.toLocaleString()}
                              </p>
                              <p className="text-2xl font-medium ">
                                {state.stakingPageInfo?.symbol}
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
                                {balances.earned.toLocaleString()}
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
                    <div
                      className={`bg-primaryLight rounded-3xl shadow-custom border border-gray-200 mt-8 w-full ${
                        state?.stakingPageInfo?.symbol === 'POP'
                          ? 'h-114'
                          : 'h-92'
                      }`}
                    >
                      <div className="flex flex-row h-full items-center justify-between">
                        <div className="relative h-full w-full">
                          <div className="mt-8 ml-8">
                            <p className="text-xl font-medium">Happy Staking</p>
                            <p className="text-base font-light w-3/12 mt-1">
                              Enjoy more sweet POP in your wallet!
                            </p>
                          </div>
                          <img
                            src="/images/catPopVault.png"
                            className={`absolute max-h-80 w-3/4 right-10  ${
                              state?.stakingPageInfo?.symbol === 'POP'
                                ? 'bottom-16'
                                : 'bottom-4'
                            }`}
                          />
                        </div>
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
