import { Web3Provider } from '@ethersproject/providers';
import { StakingRewards } from '@popcorn/hardhat/typechain';
import {
  getEarned,
  getStakingPoolsInfo,
  StakingPoolInfo,
} from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import ClaimCard from 'components/ClaimCard';
import MainActionButton from 'components/MainActionButton';
import Navbar from 'components/NavBar/NavBar';
import { connectors } from 'context/Web3/connectors';
import { ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import ContentLoader from 'react-content-loader';
import toast, { Toaster } from 'react-hot-toast';

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, active, chainId } = context;
  const [earned, setEarned] = useState<number[]>();
  const [totalEarned, setTotalEarned] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [stakingPoolsInfo, setStakingPoolsInfo] = useState<StakingPoolInfo[]>();

  useEffect(() => {
    if (!account || !contracts) {
      return;
    }
    async function getData() {
      const earned = await getEarned(account, contracts);
      setEarned(earned);
      const stakingPoolsInfo = await getStakingPoolsInfo(contracts, library);
      setStakingPoolsInfo(stakingPoolsInfo);
    }
    getData().catch((err) => console.log(err));
  }, [account, contracts, library]);

  useEffect(() => {
    if (earned?.length && stakingPoolsInfo?.length) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [earned, stakingPoolsInfo]);

  useEffect(() => {
    if (!earned) {
      return;
    }
    const totalEarned = earned.reduce(
      (totalSum, currentValue) => totalSum + currentValue,
      0,
    );
    setTotalEarned(totalEarned);
  }, [earned]);

  async function claimReward(stakingContract: StakingRewards): Promise<void> {
    toast.loading(`Claiming POP Rewards...`);
    await stakingContract
      .connect(library.getSigner())
      .getReward()
      .then((res) =>
        res.wait().then((res) => {
          toast.dismiss();
          toast.success(`POP Rewards claimed!`);
        }),
      )
      .catch((err) => toast.error(err.data.message.split("'")[1]));

    const newEarned = await getEarned(account, contracts);
    setEarned(newEarned);

    const newStakingStats = await getStakingPoolsInfo(contracts, library);
    setStakingPoolsInfo(newStakingStats);
  }
  return (
    <div className="w-full bg-white h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto mt-14">
        <div className="">
          <h1 className="text-3xl font-bold">Claim</h1>
          <p className="text-lg text-gray-500 mt-2">
            Claim your rewards or restake them to earn more
          </p>
        </div>
        <div className="w-full h-full mx-auto flex flex-row mt-10 mb-24">
          {account ? (
            <>
              <div className="w-1/3 bg-primaryLight rounded-5xl pt-44 pb-44 mb-24 shadow-custom">
                <img
                  src="/images/claimCat.png"
                  alt="claimCat"
                  className="mx-auto transform scale-101 py-2"
                />
              </div>
              <div className="w-9/12">
                <div className="flex flex-col space-y-6 ml-8">
                  {loading && <ContentLoader title="Loading ..." />}
                  {stakingPoolsInfo &&
                    stakingPoolsInfo.length > 0 &&
                    earned && (
                      <>
                        {earned &&
                          stakingPoolsInfo?.map((poolInfo, index) => (
                            <ClaimCard
                              tokenName={poolInfo.stakedTokenName}
                              claimable={earned[index] ? earned[index] : 0}
                              key={poolInfo.stakingContractAddress}
                              handleClick={() =>
                                claimReward(contracts.staking[index])
                              }
                            />
                          ))}
                      </>
                    )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full bg-primaryLight rounded-5xl pt-36 pb-36 mb-24 shadow-custom">
              <img
                src="/images/claimCat.png"
                alt="claimCat"
                className="mx-auto transform scale-101 py-2"
              />
              <div className="w-80 mx-auto mt-8">
                <MainActionButton
                  label="Connect Wallet"
                  handleClick={() => activate(connectors.Injected)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
