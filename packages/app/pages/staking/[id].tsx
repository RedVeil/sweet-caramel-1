import { Web3Provider } from "@ethersproject/providers";
import { ArrowCircleRightIcon } from "@heroicons/react/outline";
import { ERC20, PopLocker, Staking } from "@popcorn/hardhat/typechain";
import {
  bigNumberToNumber,
  getEarned,
  getERC20Contract,
  getSingleStakingPoolInfo,
  StakingPoolInfo,
} from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import StatusWithLabel from "components/Common/StatusWithLabel";
import TokenInput from "components/Common/TokenInput";
import MainActionButton from "components/MainActionButton";
import Navbar from "components/NavBar/NavBar";
import TermsAndConditions from "components/StakingTermsAndConditions";
import TokenIcon from "components/TokenIcon";
import TokenInputToggle from "components/TokenInputToggle";
import { updateStakingPageInfo } from "context/actions";
import { store } from "context/store";
import { connectors } from "context/Web3/connectors";
import { ContractsContext } from "context/Web3/contracts";
import { ethers, utils } from "ethers";
import { getSanitizedTokenDisplayName } from "helper/displayHelper";
import { formatStakedAmount } from "helper/formatStakedAmount";
import { getStakingContractFromAddress } from "helper/getStakingContractFromAddress";
import Link from "next/link";
import { useRouter } from "next/router";
import "rc-slider/assets/index.css";
import React, { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import toast, { Toaster } from "react-hot-toast";

export interface StakingPageInfo {
  stakedToken: {
    contract: ERC20;
    tokenName: string;
    symbol: string;
  };
  stakingContract: Staking | PopLocker;
  poolInfo: StakingPoolInfo;
  balances?: Balances;
}

interface Balances {
  wallet: number;
  staked: number;
  allowance: number;
  earned: number;
  withdrawable: number;
}

export default function StakingPage(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, chainId } = context;
  const [inputTokenAmount, setInputTokenAmount] = useState<number>(0);
  const [wait, setWait] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const {
    state: { stakingPageInfo },
    dispatch,
  } = useContext(store);
  const [loading, setLoading] = useState(false);
  const stakedToken = stakingPageInfo ? stakingPageInfo.stakedToken : undefined;

  useEffect(() => {
    return () => {
      dispatch(updateStakingPageInfo(undefined));
    };
  }, []);

  useEffect(() => {
    if (getCurrentStakingContract() === undefined) {
      router.push("/staking");
      return;
    }
  }, [library, contracts, chainId]);

  useEffect(() => {
    if (!library || !contracts || !chainId) {
      return;
    }
    fetchPageInfo();
  }, [contracts, library, account]);

  const getBalances = async (stakedToken, stakingContract) => {
    if (!account) {
      return undefined;
    }
    const inputBalance = await stakedToken.balanceOf(account);
    const allowance = await stakedToken.allowance(account, stakingContract?.address);
    const stakedAmount =
      id === contracts.popStaking.address
        ? await (stakingContract as PopLocker)?.lockedBalanceOf(account)
        : await (stakingContract as Staking)?.balanceOf(account);
    const earned = await getEarned(stakingContract, account, id === contracts.popStaking.address);
    const withdrawable =
      id === contracts.popStaking.address
        ? await (
            await (stakingContract as PopLocker).lockedBalances(account)
          ).unlockable
        : stakedAmount;

    return {
      wallet: bigNumberToNumber(inputBalance),
      staked: bigNumberToNumber(stakedAmount),
      allowance: bigNumberToNumber(allowance),
      earned: bigNumberToNumber(earned),
      withdrawable: bigNumberToNumber(withdrawable),
    };
  };

  function getCurrentStakingContract(): Staking | PopLocker | undefined {
    if (!contracts || !contracts?.popStaking || (contracts?.staking?.length || 0) <= 0) {
      return undefined;
    }
    const stakingContract: Staking | PopLocker = [contracts.popStaking, ...contracts.staking].find(
      (contract) => contract.address === id,
    );
    return stakingContract;
  }

  async function fetchPageInfo(): Promise<void> {
    setLoading(true);
    if (!contracts || (contracts?.staking?.length || 0) <= 0) {
      return;
    }
    const stakingContract = await getStakingContractFromAddress(contracts, id as string);

    const stakingPoolInfo: StakingPoolInfo = await getSingleStakingPoolInfo(
      stakingContract,
      library,
      id === contracts.popStaking.address ? contracts.pop.address : null,
      id === contracts.popStaking.address ? "Popcorn" : null,
    );
    if (!stakingPoolInfo.stakedTokenAddress) {
      return;
    }

    const stakedTokenContract = await getERC20Contract(stakingPoolInfo.stakedTokenAddress, library);
    const stakedToken = {
      contract: stakedTokenContract,
      tokenName: getSanitizedTokenDisplayName(await stakedTokenContract.name()),
      symbol: await stakedTokenContract.symbol(),
    };

    const balances = await getBalances(stakedToken.contract, stakingContract);
    dispatch(
      updateStakingPageInfo({
        stakingContract,
        stakedToken,
        poolInfo: stakingPoolInfo,
        balances: balances,
      }),
    );
    setLoading(false);
  }

  async function stake(): Promise<void> {
    setWait(true);
    toast.loading(`Staking ${stakedToken.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking = await stakingPageInfo.stakingContract.connect(signer);
    const stakeCall =
      id === contracts.popStaking.address
        ? (connectedStaking as PopLocker).lock(account, lockedPopInEth, 0)
        : (connectedStaking as Staking).stake(lockedPopInEth);
    await stakeCall
      .then((res) =>
        res.wait().then(async (res) => {
          {
            toast.dismiss();
            toast.success(`${stakedToken?.tokenName} staked!`);
            await fetchPageInfo();
            setWait(false);
            setInputTokenAmount(0);
          }
        }),
      )
      .catch((err) => {
        toast.dismiss();
        if (err.message === "MetaMask Tx Signature: User denied transaction signature.") {
          toast.error("Transaction was canceled");
        } else {
          toast.error(err.message.split("'")[1]);
        }
        setWait(false);
      });
  }

  async function withdrawStake(): Promise<void> {
    setWait(true);
    toast.loading(`Withdrawing ${stakedToken?.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking = await stakingPageInfo.stakingContract.connect(signer);

    const call =
      id === contracts.popStaking.address
        ? (connectedStaking as PopLocker)["processExpiredLocks(bool)"](false)
        : (connectedStaking as Staking).withdraw(lockedPopInEth);

    await call
      .then((res) =>
        res.wait().then(async (res) => {
          {
            toast.dismiss();
            toast.success(`${stakedToken?.tokenName} withdrawn!`);
            await fetchPageInfo();
            setWait(false);
            setInputTokenAmount(0);
          }
        }),
      )
      .catch((err) => {
        toast.dismiss();
        if (err.message === "MetaMask Tx Signature: User denied transaction signature.") {
          toast.error("Transaction was canceled");
        } else {
          toast.error(err.message.split("'")[1]);
        }
        setWait(false);
      });
  }

  async function restake(): Promise<void> {
    setWait(true);
    toast.loading(`Restaking POP...`);
    const signer = library.getSigner();
    const connectedStaking = await stakingPageInfo.stakingContract.connect(signer);

    await (connectedStaking as PopLocker)
      ["processExpiredLocks(bool)"](true)
      .then((res) =>
        res.wait().then(async (res) => {
          {
            toast.dismiss();
            toast.success(`Restaked POP!`);
            await fetchPageInfo();
            setWait(false);
            setInputTokenAmount(0);
          }
        }),
      )
      .catch((err) => {
        toast.dismiss();
        if (err.message === "MetaMask Tx Signature: User denied transaction signature.") {
          toast.error("Transaction was canceled");
        } else {
          toast.error(err.message.split("'")[1]);
        }
        setWait(false);
      });
  }

  async function approve(): Promise<void> {
    setWait(true);
    toast.loading(`Approving ${stakedToken?.tokenName} for staking...`);
    const connected = await stakingPageInfo?.stakedToken.contract.connect(library.getSigner());
    await connected
      .approve(stakingPageInfo?.stakingContract?.address, ethers.constants.MaxUint256)
      .then((res) =>
        res.wait().then(async (res) => {
          toast.dismiss();
          toast.success(`${stakingPageInfo?.stakedToken.tokenName} approved!`);
          await fetchPageInfo();
          setWait(false);
        }),
      )
      .catch((err) => {
        toast.dismiss();
        if (err.message === "MetaMask Tx Signature: User denied transaction signature.") {
          toast.error("Transaction was canceled");
        } else {
          console.log(err);
          console.log(err.message);
          toast.error(err.message.split("'")[1]);
        }
        setWait(false);
      });
  }

  return (
    <>
      <div className="overflow-hidden w-screen">
        <Navbar />
        <Toaster position="top-right" />
        <div className="lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto pb-28">
          <div className="md:w-2/3 mt-14">
            {(loading && (
              <div>
                <ContentLoader speed={1} viewBox="0 0 500 84">
                  <rect x="9" y="4" rx="10" ry="10" width="320" height="22" />
                  <rect x="18" y="14" rx="10" ry="10" width="303" height="6" />
                  <rect x="11" y="33" rx="10" ry="10" width="108" height="13" />
                  <rect x="129" y="33" rx="10" ry="10" width="60" height="13" />
                  <rect x="196" y="33" rx="10" ry="10" width="60" height="13" />
                </ContentLoader>
              </div>
            )) || (
              <div className="">
                {stakingPageInfo && (
                  <span className="flex flex-row items-center justify-center md:justify-start">
                    <TokenIcon token={stakedToken?.tokenName} />
                    <h1 className="ml-3 header-major uppercase">{stakedToken?.tokenName}</h1>
                  </span>
                )}
                <div className="flex flex-row flex-wrap items-center mt-4 justify-center md:justify-start">
                  <div className="px-6 border-r-2 border-gray-200 mt-2">
                    <StatusWithLabel
                      content={"New 🍿✨"}
                      //content={
                      //  stakingPageInfo?.stakedToken?.symbol === 'POP'
                      //    ? stakingPageInfo?.poolInfo.apy.toLocaleString() + '%'
                      //    : 'New 🍿✨'
                      //}
                      label="Est. APY"
                      green
                    />
                  </div>
                  <div className="px-6 md:border-r-2 border-gray-200 mt-2">
                    <StatusWithLabel
                      content={
                        stakingPageInfo?.poolInfo ? formatStakedAmount(stakingPageInfo?.poolInfo.totalStake) : "0"
                      }
                      label="Total Staked"
                    />
                  </div>
                  <div className="px-6 mt-2 text-center md:text-left">
                    <StatusWithLabel
                      content={`${
                        stakingPageInfo?.poolInfo ? stakingPageInfo?.poolInfo.tokenEmission.toLocaleString() : 0
                      } POP / day`}
                      label="Emission Rate"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row mt-10 mx-4">
            <div className="md:w-1/3">
              {(loading && (
                <ContentLoader viewBox="0 0 450 600">
                  <rect x="0" y="0" rx="20" ry="20" width="400" height="600" />
                </ContentLoader>
              )) || (
                <div className="pt-4 h-full px-6 border border-gray-200 rounded-3xl shadow-custom mb-10">
                  <div className="pt-2">
                    <TokenInputToggle toggled={withdraw} toggle={setWithdraw} labels={["Stake", "Unstake"]} />
                  </div>
                  <div className="pt-16 pb-10">
                    {stakingPageInfo && (
                      <>
                        {stakedToken?.symbol === "POP" && withdraw ? (
                          <div className="md:w-96 mx-auto">
                            <div className="w-full mb-10">
                              <label
                                htmlFor="tokenInput"
                                className="flex justify-between text-sm font-medium text-gray-700 text-center"
                              >
                                <p className="mb-2  text-base">Withdrawable Amount</p>
                              </label>
                              <div className="mt-1 relative flex items-center">
                                <input
                                  type="number"
                                  name="tokenInput"
                                  id="tokenInput"
                                  className="shadow-sm block w-full pl-4 pr-16 py-4 text-lg border-gray-300 bg-gray-100 rounded-xl"
                                  value={stakingPageInfo?.balances?.withdrawable}
                                  disabled
                                />
                                <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                                  <p className="inline-flex items-center  font-medium text-lg mx-3">POP</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-row items-center space-x-4">
                              <MainActionButton
                                label={"Restake"}
                                handleClick={() => restake()}
                                disabled={wait || stakingPageInfo?.balances?.withdrawable === 0 || !account}
                              />
                              <MainActionButton
                                label={`Withdraw ${stakedToken?.symbol}`}
                                handleClick={withdrawStake}
                                disabled={wait || stakingPageInfo?.balances?.withdrawable === 0}
                              />
                            </div>
                          </div>
                        ) : (
                          <TokenInput
                            label={withdraw ? "Unstake Amount" : "Stake Amount"}
                            tokenName={stakedToken?.symbol}
                            inputAmount={inputTokenAmount}
                            balance={withdraw ? stakingPageInfo?.balances?.staked : stakingPageInfo?.balances?.wallet}
                            updateInputAmount={setInputTokenAmount}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {stakingPageInfo && (
                    <div>
                      {account ? (
                        <>
                          {withdraw ? (
                            <div></div>
                          ) : (
                            <>
                              {stakingPageInfo?.balances?.allowance >= inputTokenAmount ? (
                                <TermsAndConditions
                                  isDisabled={false}
                                  termsAccepted={termsAccepted}
                                  setTermsAccepted={setTermsAccepted}
                                  showLockTerms={stakedToken?.symbol === "POP"}
                                />
                              ) : (
                                <TermsAndConditions
                                  isDisabled={true}
                                  termsAccepted={termsAccepted}
                                  setTermsAccepted={setTermsAccepted}
                                  showLockTerms={stakedToken?.symbol === "POP"}
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
                              showLockTerms={stakedToken?.symbol === "POP"}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {stakingPageInfo && (
                    <div className="mx-auto pt-2 pb-6">
                      {account ? (
                        <>
                          {withdraw ? (
                            <>
                              {stakedToken?.symbol === "POP" ? (
                                <></>
                              ) : (
                                <MainActionButton
                                  label={`Withdraw ${stakedToken?.symbol}`}
                                  handleClick={withdrawStake}
                                  disabled={wait || stakingPageInfo?.balances?.withdrawable === 0}
                                />
                              )}
                            </>
                          ) : (
                            <>
                              {stakingPageInfo?.balances?.allowance >= inputTokenAmount ? (
                                <div className="mt-4">
                                  <MainActionButton
                                    label={`Stake ${stakedToken?.symbol}`}
                                    handleClick={stake}
                                    disabled={!termsAccepted || inputTokenAmount === 0 || wait}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <MainActionButton
                                    label={"Approve for Staking"}
                                    handleClick={approve}
                                    disabled={wait || inputTokenAmount === 0}
                                  />
                                  <MainActionButton
                                    label={`Stake ${stakedToken?.symbol}`}
                                    handleClick={stake}
                                    disabled={true}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <div className="mt-4">
                          <MainActionButton
                            label={"Connect Wallet"}
                            handleClick={() => activate(connectors.Injected)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="md:w-2/3 md:ml-12">
              {(loading && (
                <ContentLoader viewBox="0 0 450 400">
                  <rect x="0" y="0" rx="15" ry="15" width="388" height="108" />
                  <rect x="0" y="115" rx="15" ry="15" width="388" height="216" />
                </ContentLoader>
              )) || (
                <div className="">
                  {stakingPageInfo?.balances && (
                    <>
                      <div className="rounded-3xl shadow-custom border border-gray-200 w-full">
                        <div className="h-32 md:h-28 pt-8 px-8">
                          <div className="flex flex-row items-center justify-between">
                            <div>
                              <h2 className="text-gray-500 uppercase text-base">Your Staked Balance</h2>
                              <div className="flex flex-row items-center mt-1">
                                <p className="text-2xl font-medium  mr-2">
                                  {formatStakedAmount(stakingPageInfo?.balances?.staked)}
                                </p>
                                <p className="text-2xl font-medium ">{stakedToken?.symbol}</p>
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
                        <div className="h-32 md:h-28 bg-blue-50 rounded-b-3xl py-8 px-8">
                          <div className="flex flex-row justify-between items-end md:items-center ">
                            <div>
                              <h2 className="text-gray-500 text-base uppercase">Your Staking Rewards</h2>
                              <div className="flex flex-row items-center mt-1">
                                <p className="text-2xl font-medium  mr-2">
                                  {stakingPageInfo?.balances?.earned.toLocaleString()}
                                </p>
                                <p className="text-2xl font-medium ">POP</p>
                              </div>
                            </div>
                            <Link href="/rewards" passHref>
                              <a className="flex flex-shrink-0 text-lg text-blue-600 font-medium py-3 hover:text-white whitespace-nowrap">
                                <span className="hidden md:inline mr-1">Go to</span>
                                Claim Page
                                <ArrowCircleRightIcon height={18} className="inline self-center ml-2" />
                              </a>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="relative bg-primaryLight rounded-3xl shadow-custom border border-gray-200 mt-8 w-full h-64 md:h-124">
                    <div className="mt-8 ml-8">
                      <p className="text-xl font-medium">Happy Staking</p>
                      <p className="text-base font-light mt-1">Enjoy more sweet POP in your wallet!</p>
                    </div>
                    <img
                      src="/images/catPopVault.svg"
                      className={"absolute max-h-80 w-3/4 right-10 bottom-1 md:bottom-16"}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
