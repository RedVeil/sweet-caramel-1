import { Web3Provider } from '@ethersproject/providers';
import { Switch } from '@headlessui/react';
import { ERC20, StakingRewards } from '@popcorn/hardhat/typechain';
import { calculateAPY } from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import TokenInput from 'components/Common/TokenInput';
import MainActionButton from 'components/MainActionButton';
import Navbar from 'components/NavBar/NavBar';
import { connectors } from 'context/Web3/connectors';
import { Contracts, ContractsContext } from 'context/Web3/contracts';
import { utils } from 'ethers';
import { useRouter } from 'next/router';
import 'rc-slider/assets/index.css';
import { useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface StakingInfo {
  inputToken: ERC20;
  stakingContract: StakingRewards;
  tokenName: string;
}

function getStakingInfo(id: string, contracts: Contracts): StakingInfo {
  switch (id) {
    case 'pop':
      return {
        inputToken: contracts.pop,
        stakingContract: contracts.staking.pop,
        tokenName: 'POP',
      };
    case 'pop-eth-lp':
      return {
        inputToken: contracts.popEthLp,
        stakingContract: contracts.staking.popEthLp,
        tokenName: 'POP-ETH LP',
      };
    case 'butter':
      return {
        inputToken: contracts.butter,
        stakingContract: contracts.staking.butter,
        tokenName: 'Butter',
      };
  }
}

export default function stake(): JSX.Element {
  const router = useRouter();
  const { id } = router.query;
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, active } = context;
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>();
  const [inputTokenAmount, setInputTokenAmount] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [amountStaked, setAmountStaked] = useState(0);
  const [approved, setApproval] = useState<number>(0);
  const [apy, setApy] = useState<number>(0);
  const [wait, setWait] = useState<boolean>(false);
  const [withdraw, setWithdraw] = useState<boolean>(false);

  useEffect(() => {
    if (!id || !contracts) {
      return;
    }
    setStakingInfo(getStakingInfo(id as string, contracts));
  }, [id, contracts]);

  useEffect(() => {
    if (!account || !stakingInfo || !contracts) {
      return;
    }
    updateData();
  }, [account, stakingInfo]);

  async function updateData(): Promise<void> {
    const inputBalance = await stakingInfo.inputToken.balanceOf(account);
    console.log(inputBalance);
    setTokenBalance((prevState) => Number(utils.formatEther(inputBalance)));

    const allowance = await stakingInfo.inputToken.allowance(
      account,
      stakingInfo.stakingContract.address,
    );
    setApproval((prevState) => Number(utils.formatEther(allowance)));

    const stakedAmount = await stakingInfo.stakingContract.balanceOf(account);
    setAmountStaked(Number(utils.formatEther(stakedAmount)));

    const apy = await calculateAPY(
      await stakingInfo.stakingContract.getRewardForDuration(),
      await stakingInfo.stakingContract.totalSupply(),
    );
    setApy((prevState) => apy);
  }

  async function stake(): Promise<void> {
    setWait(true);
    toast.loading(`Staking ${stakingInfo.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking = await stakingInfo.stakingContract.connect(signer);
    await connectedStaking
      .stake(lockedPopInEth)
      .then((res) =>
        res.wait().then((res) => {
          {
            toast.dismiss();
            toast.success(`${stakingInfo.tokenName} staked!`);
          }
        }),
      )
      .catch((err) => {
        toast.error(err.data.message.split("'")[1]);
      });

    await updateData();
    setWait(false);
    setInputTokenAmount(0);
  }

  async function withdrawStake(): Promise<void> {
    setWait(true);
    toast.loading(`Withdrawing ${stakingInfo.tokenName}...`);
    const lockedPopInEth = utils.parseEther(inputTokenAmount.toString());
    const signer = library.getSigner();
    const connectedStaking = await stakingInfo.stakingContract.connect(signer);
    await connectedStaking
      .withdraw(lockedPopInEth)
      .then((res) =>
        res.wait().then((res) => {
          {
            toast.dismiss();
            toast.success(`${stakingInfo.tokenName} withdrawn!`);
          }
        }),
      )
      .catch((err) => {
        toast.error(err.data.message.split("'")[1]);
      });
    await updateData();
    setWait(false);
    setInputTokenAmount(0);
  }

  async function approve(): Promise<void> {
    setWait(true);
    toast.loading(`Approving ${stakingInfo.tokenName} for staking...`);

    // Ensure that inputTokenAmount is in the format 10000000... instead of 10e+5
    // because parseEther breaks with exponential String
    const formattedToken = inputTokenAmount.toLocaleString().replace(/,/gi, '');
    const lockedTokenInEth = utils.parseEther(formattedToken);
    const connected = await contracts.pop.connect(library.getSigner());
    await connected
      .approve(stakingInfo.stakingContract.address, lockedTokenInEth)
      .then((res) =>
        res.wait().then((res) => {
          toast.dismiss();
          toast.success(`${stakingInfo.tokenName} approved!`);
        }),
      )
      .catch((err) => toast.error(err.data.message.split("'")[1]));
    await updateData();
    setWait(false);
  }

  return (
    <div className="w-full bg-gray-100 h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="bg-gray-100">
        <div className="pt-12 px-4 sm:px-6 lg:px-8 lg:pt-20">
          <div className="text-center">
            <h2 className="text-lg leading-6 font-semibold text-gray-300 uppercase tracking-wider"></h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-800 sm:text-4xl lg:text-5xl">
              Stake {stakingInfo && stakingInfo.tokenName}
            </p>
          </div>
        </div>

        <div className="mt-8 pb-12 lg:mt-8 lg:pb-20">
          <div className="relative z-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative lg:grid lg:grid-cols-7">
                <div className="mt-10 max-w-lg mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-start-3 lg:col-end-6 lg:row-start-1 lg:row-end-4">
                  <div className="relative z-10 rounded-lg shadow-xl">
                    <div className="bg-white rounded-lg px-6 pt-12 pb-10">
                      <div className="flex flex-col">
                        <h3
                          className="text-center text-3xl font-semibold text-gray-900 sm:-mx-6"
                          id="tier-growth"
                        >
                          APY
                        </h3>
                        <p className="px-3 text-center my-4 text-4xl font-black tracking-tight text-gray-900 sm:text-6xl">
                          {apy.toLocaleString()} %
                        </p>
                        <div className="w-10/12 mx-auto mt-4">
                          {stakingInfo && (
                            <TokenInput
                              tokenName={stakingInfo.tokenName}
                              inputAmount={inputTokenAmount}
                              balance={withdraw ? amountStaked : tokenBalance}
                              updateInputAmount={setInputTokenAmount}
                            />
                          )}
                        </div>
                        <Switch.Group
                          as="div"
                          className="flex items-center ml-10 mt-2"
                        >
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
                              {stakingInfo && stakingInfo.tokenName}
                            </span>
                          </Switch.Label>
                        </Switch.Group>
                      </div>
                      {stakingInfo && (
                        <div className="rounded-lg shadow-md mt-12 w-96 mx-auto">
                          {account ? (
                            <>
                              {withdraw ? (
                                <MainActionButton
                                  label={`Withdraw ${stakingInfo.tokenName}`}
                                  handleClick={withdrawStake}
                                  disabled={wait || amountStaked === 0}
                                />
                              ) : (
                                <>
                                  {approved >= inputTokenAmount ? (
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
