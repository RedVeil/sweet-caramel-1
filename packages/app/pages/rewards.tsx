import { Web3Provider } from '@ethersproject/providers';
import { StakingRewards } from '@popcorn/hardhat/typechain';
import { getEarned, getStakingStats, StakingStats } from '@popcorn/utils';
import { TokenBalances } from '@popcorn/utils/getBalances';
import { useWeb3React } from '@web3-react/core';
import ClaimCard from 'components/ClaimCard';
import Navbar from 'components/NavBar/NavBar';
import StatInfoCard from 'components/StatInfoCard';
import { ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, active } = context;
  const [earned, setEarned] = useState<TokenBalances>();
  const [totalEarned, setTotalEarned] = useState<number>();
  const [stakingStats, setStakingStats] = useState<StakingStats>();

  useEffect(() => {
    if (!account || !contracts) {
      return;
    }
    getEarned(account, contracts).then((res) => setEarned(res));
    getStakingStats(contracts).then((res) => setStakingStats(res));
  }, [account, contracts]);

  useEffect(() => {
    if (!earned) {
      return;
    }
    setTotalEarned(earned.pop + earned.popEthLp + earned.butter);
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
    setEarned((prevState) => newEarned);

    const newStakingStats = await getStakingStats(contracts);
    setStakingStats((prevState) => newStakingStats);
  }

  return (
    <div className="w-full bg-white h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
        <div className="w-9/12 mx-auto mt-14">
          <h1 className="text-3xl text-gray-800 font-medium">Staking</h1>
          <p className="text-lg text-gray-500">
            Earn more income staking your crypto with us
          </p>
        </div>
        <div className="w-9/12 mx-auto flex flex-row mt-14">
          <div className="w-2/12 space-y-4 mr-20">
            <p className="text-lg font-medium text-gray-800 pl-3 py-3 rounded-md cursor-pointer hover:bg-gray-100 hover:text-gray-900">
              Staking
            </p>
            <p className="text-lg font-medium text-gray-500 pl-3 py-3 rounded-md cursor-pointer hover:bg-gray-100 hover:text-gray-700">
              Coming soon...
            </p>
            <p className="text-lg font-medium text-gray-500 pl-3 py-3 rounded-md cursor-pointer hover:bg-gray-100 hover:text-gray-700">
              Coming soon...
            </p>
          </div>

          <div className="w-9/12">
            <img src="/images/claimCat.svg" alt="claimCat" />
            {totalEarned && (
              <div className="mt-8 flex flex-row items-center">
                <div className="w-1/2">
                  <StatInfoCard
                    title="Cumulative Rewards"
                    content={`${totalEarned.toLocaleString()} POP`}
                    icon={{ icon: 'Money', color: 'bg-blue-300' }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-row items-center mt-8">
              {stakingStats && earned && (
                <>
                  <ClaimCard
                    tokenName="POP Rewards"
                    apy={stakingStats.pop.apy}
                    claimable={earned.pop}
                    handleClick={() => claimReward(contracts.staking.pop)}
                  />
                  <ClaimCard
                    tokenName="POP/ETH LP"
                    apy={stakingStats.popEthLp.apy}
                    claimable={earned.popEthLp}
                    handleClick={() => claimReward(contracts.staking.popEthLp)}
                  />
                  <ClaimCard
                    tokenName="BUTTER"
                    apy={stakingStats.butter.apy}
                    claimable={earned.butter}
                    handleClick={() => claimReward(contracts.staking.butter)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
