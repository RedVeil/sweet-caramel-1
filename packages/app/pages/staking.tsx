import { Web3Provider } from '@ethersproject/providers';
import { StakingRewards } from '@popcorn/hardhat/typechain';
import { useWeb3React } from '@web3-react/core';
import MainActionButton from 'components/MainActionButton';
import Navbar from 'components/NavBar/NavBar';
import { connectors } from 'context/Web3/connectors';
import { ContractsContext } from 'context/Web3/contracts';
import { utils } from 'ethers';
import 'rc-slider/assets/index.css';
import { useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ONE_WEEK = 604800;
const lockPeriods = [
  { label: '1 week', value: ONE_WEEK },
  { label: '1 month', value: ONE_WEEK * 4 },
  { label: '3 months', value: ONE_WEEK * 4 * 3 },
  { label: '6 months', value: ONE_WEEK * 4 * 6 },
  { label: '1 year', value: ONE_WEEK * 52 },
  { label: '4 years', value: ONE_WEEK * 52 * 4 },
];

export default function LockPop() {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, active } = context;
  const [popToLock, setPopToLock] = useState<number>(0);
  const [lockDuration, setLockDuration] = useState<number>(ONE_WEEK);
  const [popBalance, setPopBalance] = useState(0);
  const [lockedPop, setLockedPop] = useState(0);
  const [voiceCredits, setVoiceCredits] = useState<number>(0);
  const [approved, setApproval] = useState<number>(0);
  const [wait, setWait] = useState<boolean>(false);

  useEffect(() => {
    setVoiceCredits(popToLock * (lockDuration / (ONE_WEEK * 52 * 4)));
  }, [lockDuration, popToLock]);

  useEffect(() => {
    if (!account) {
      return;
    }
    contracts.pop
      .balanceOf(account)
      .then((res) => setPopBalance(Number(utils.formatEther(res))));
    contracts.pop
      .allowance(account, process.env.ADDR_STAKING)
      .then((res) => setApproval(Number(utils.formatEther(res))));
  }, [account]);

  const getLockedPop = async () => {
    // const lockedBalance = await stakingContract.lockedBalances(account);
    // const currentTime = parseInt(`${new Date().getTime() / 1000}`);
    // setExpired(lockedBalance.end.lt(currentTime));
    // setLockedPop(
    //   Number(utils.formatEther(await stakingContract.balanceOf(account))),
    // );
    setLockedPop(100);
  };

  useEffect(() => {
    if (contracts?.staking && account) {
      getLockedPop();
    }
  }, [contracts]);

  async function lockPop(stakingContract: StakingRewards): Promise<void> {
    setWait(true);
    toast.loading('Staking POP...');
    const lockedPopInEth = utils.parseEther(popToLock.toString());
    const signer = library.getSigner();
    const connectedStaking = await stakingContract.connect(signer);
    await connectedStaking
      .stake(lockedPopInEth)
      .then((res) => {
        toast.success('POP staked!');
      })
      .catch((err) => {
        toast.error(err.data.message.split("'")[1]);
      });
    setWait(false);
  }

  async function approve(stakingAddress: string): Promise<void> {
    setWait(true);
    toast.loading('Approving POP for staking...');

    // Ensure that popToLock is in the format 10000000... instead of 10e+5
    // because parseEther breaks with exponential String
    const formattedPop = popToLock.toLocaleString().replace(/,/gi, '');
    const lockedPopInEth = utils.parseEther(formattedPop);
    const connected = await contracts.pop.connect(library.getSigner());
    await connected
      .approve(stakingAddress, lockedPopInEth)
      .then((res) => toast.success('POP approved!'))
      .catch((err) => toast.error(err.data.message.split("'")[1]));
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
              Stake POP
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
                          24.5%
                        </p>
                        <div className="w-10/12 mx-auto mt-4">
                          <div className="w-full">
                            <span className="flex flex-col justify-between">
                              <div className="">
                                <p className="font-semibold text-sm text-gray-900 mb-1">
                                  Staking Amount
                                </p>
                                <div className="rounded-md border border-gray-200 px-8 py-4">
                                  <div className="flex flex-row justify-between">
                                    <input
                                      className="w-60 text-xl"
                                      placeholder="-"
                                      value={900002320}
                                      onChange={(e) => console.log()}
                                    />
                                    <span className="flex flex-row items-center">
                                      <p className="text-gray-400 cursor-pointer text-xl hover:text-gray-800">
                                        MAX
                                      </p>
                                      <p className="text-gray-700 font-semibold text-xl ml-2">
                                        POP
                                      </p>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg shadow-md mt-12 w-96 mx-auto">
                        {!account && (
                          <MainActionButton
                            label={'Connect Wallet'}
                            handleClick={() => activate(connectors.Injected)}
                          />
                        )}
                        {account && approved >= popToLock && !lockedPop && (
                          <MainActionButton
                            label={'Stake POP'}
                            handleClick={lockPop}
                            disabled={wait || popToLock === 0}
                          />
                        )}
                        {account && approved < popToLock && (
                          <MainActionButton
                            label={'Approve'}
                            handleClick={approve}
                            disabled={wait || popToLock === 0}
                          />
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
    </div>
  );
}
