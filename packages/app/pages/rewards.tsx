import { Web3Provider } from '@ethersproject/providers';
import { StakingRewards } from '@popcorn/hardhat/typechain';
import { getEarned, getStakingReturns } from '@popcorn/utils';
import { TokenBalances } from '@popcorn/utils/getBalances';
import { useWeb3React } from '@web3-react/core';
import ClaimableInfo from 'components/ClaimableInfo';
import Navbar from 'components/NavBar/NavBar';
import StakeClaimCard from 'components/StakeClaimCard';
import { ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import * as Icon from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, account, activate, active } = context;
  const [earned, setEarned] = useState<TokenBalances>();
  const [totalEarned, setTotalEarned] = useState<number>();
  const [stakingReturns, setStakingReturns] = useState<TokenBalances>();

  useEffect(() => {
    if (!account || !contracts) {
      return;
    }
    getEarned(account, contracts).then((res) => setEarned(res));
    getStakingReturns(contracts).then((res) => setStakingReturns(res));
  }, [account, contracts]);

  useEffect(() => {
    if (!earned) {
      return;
    }
    setTotalEarned(earned.pop + earned.popEthLp + earned.butter);
  }, [earned]);

  async function claimReward(stakingContract: StakingRewards): Promise<void> {
    toast.loading(`Claiming POP Rewards...`);
    stakingContract
      .connect(library.getSigner())
      .getReward()
      .then((res) => {
        toast.dismiss();
        toast.success(`POP Rewards claimed!`);
      })
      .catch((err) => toast.error(err.data.message.split("'")[1]));
    getEarned(account, contracts).then((res) => setEarned(res));
    getStakingReturns(contracts).then((res) => setStakingReturns(res));
  }

  return (
    <div className="w-full bg-gray-50 h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
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
            <div className="flex flex-row items-center">
              <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center">
                <Icon.Gift className="text-white mx-auto" />
              </div>
              <h1 className="ml-2 text-3xl text-gray-800 font-medium">
                Staking Rewards
              </h1>
            </div>

            <div className="flex flex-row items-center mt-8">
              <ClaimableInfo earned={totalEarned} />
            </div>

            <div className="flex flex-row items-center mt-16">
              {stakingReturns && earned && (
                <>
                  <StakeClaimCard
                    title="POP Rewards"
                    icon={{ color: 'bg-pink-400', icon: 'Gift' }}
                    infos={[
                      {
                        title: 'APY',
                        info: `${stakingReturns.pop.toLocaleString()} %`,
                      },
                      {
                        title: 'Claimable',
                        info: `${earned.pop.toLocaleString()} POP`,
                      },
                    ]}
                    buttonLabel="Claim"
                    handleClick={() => claimReward(contracts.staking.pop)}
                  />
                  <StakeClaimCard
                    title="POP-ETH LP Rewards"
                    icon={{ color: 'bg-pink-400', icon: 'Gift' }}
                    infos={[
                      {
                        title: 'APY',
                        info: `${stakingReturns.popEthLp.toLocaleString()} %`,
                      },
                      {
                        title: 'Claimable',
                        info: `${earned.popEthLp.toLocaleString()} POP`,
                      },
                    ]}
                    buttonLabel="Claim"
                    handleClick={() => claimReward(contracts.staking.popEthLp)}
                  />
                  <StakeClaimCard
                    title="BUTTER Rewards"
                    icon={{ color: 'bg-pink-400', icon: 'Gift' }}
                    infos={[
                      {
                        title: 'APY',
                        info: `${stakingReturns.butter.toLocaleString()} %`,
                      },
                      {
                        title: 'Claimable',
                        info: `${earned.butter.toLocaleString()} POP`,
                      },
                    ]}
                    buttonLabel="Claim"
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
