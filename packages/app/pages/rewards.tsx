import { Web3Provider } from '@ethersproject/providers';
import { StakingRewards } from '@popcorn/hardhat/typechain';
import {
  getEarned,
  getStakingPoolsInfo,
  StakingPoolInfo,
} from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import ClaimCard from 'components/ClaimCard';
import Navbar from 'components/NavBar/NavBar';
import { ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, active, chainId } = context;
  const [earned, setEarned] = useState<number[]>();
  const [totalEarned, setTotalEarned] = useState<number>();
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
      <div className="">
        <div className="lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto mt-14">
          <h1 className="text-3xl  font-medium">Claim</h1>
          <p className="text-lg text-gray-500 mt-2">
            Claim your rewards or restake them to earn more
          </p>
        </div>
        <div className="w-9/12 h-full mx-auto flex flex-row mt-10 mb-24">
          <div className="w-4/12 h-full shadow-custom rounded-5xl mt-2 -top-0.5">
            <img
              src="/images/claimCat.svg"
              alt="claimCat"
              className="w-full h-full object-cover transform scale-y-103"
            />
          </div>
          <div className="w-9/12">
            <div className="flex flex-col space-y-6 ml-8">
              {stakingPoolsInfo && stakingPoolsInfo.length > 0 && earned && (
                <>
                  {earned &&
                    stakingPoolsInfo?.map((poolInfo, index) => (
                      <ClaimCard
                        tokenName={poolInfo.stakedTokenName}
                        claimable={earned[index] ? earned[index] : 0}
                        handleClick={() =>
                          claimReward(contracts.staking[index])
                        }
                      />
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
