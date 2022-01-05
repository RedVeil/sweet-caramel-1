import { Web3Provider } from '@ethersproject/providers';
import { PopLocker, Staking } from '@popcorn/hardhat/typechain';
import {
  bigNumberToNumber,
  getEarned,
  getSingleStakingPoolInfo,
  StakingPoolInfo,
} from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import LoadingSpinner from 'components/LoadingSpinner';
import Navbar from 'components/NavBar/NavBar';
import ClaimCard from 'components/Rewards/ClaimCard';
import VestingRecordComponent from 'components/Rewards/VestingRecord';
import TokenInputToggle from 'components/TokenInputToggle';
import { setSingleActionModal } from 'context/actions';
import { store } from 'context/store';
import { ContractsContext } from 'context/Web3/contracts';
import { BigNumber } from 'ethers';
import useClaimEscrows from 'hooks/useClaimEscrows';
import useClaimStakingReward from 'hooks/useClaimStakingReward';
import useGetUserEscrows, { Escrow } from 'hooks/useGetUserEscrows';
import React, { useContext, useEffect, useState } from 'react';
import { ChevronDown } from 'react-feather';
import { toast, Toaster } from 'react-hot-toast';
import { SWRResponse } from 'swr';
import { connectors } from '../context/Web3/connectors';

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { account, library, chainId, activate, deactivate } = context;
  const { dispatch } = useContext(store);
  const [showEscrows, setShowEscrows] = useState<boolean>(false);
  const [stakingPoolsInfo, setStakingPoolsInfo] = useState<StakingPoolInfo[]>();
  const [visibleEscrows, setVisibleEscrows] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);

  const claimStakingReward = useClaimStakingReward();
  const claimVestedPopFromEscrows = useClaimEscrows();

  useEffect(() => {
    if (!account || !contracts) {
      return;
    }
    setLoading(true);
    getData().then((res) => setLoading(false));
  }, [account, contracts, library]);

  const userEscrowsFetchResult: SWRResponse<
    { escrows: Escrow[]; totalClaimablePop: BigNumber },
    any
  > = useGetUserEscrows();

  async function getData(): Promise<void> {
    let newStakingPoolsInfo: StakingPoolInfo[] = [];
    const popStakingInfo = await getSingleStakingPoolInfo(
      contracts.popStaking,
      library,
      contracts.pop.address,
      'POP',
    );
    popStakingInfo.earned = bigNumberToNumber(
      await getEarned(contracts.popStaking, account, true),
    );
    newStakingPoolsInfo.push(popStakingInfo);

    if (contracts.staking.length > 0) {
      await Promise.all(
        contracts.staking.map(async (stakingContract) => {
          const poolInfo = await getSingleStakingPoolInfo(
            stakingContract,
            library,
          );
          const earnedRewards = await getEarned(
            stakingContract,
            account,
            false,
          );
          poolInfo.earned = bigNumberToNumber(earnedRewards);
          newStakingPoolsInfo.push(poolInfo);
        }),
      );
    }
    setStakingPoolsInfo(newStakingPoolsInfo);
  }

  const poolClaimHandler = async (
    pool: Staking | PopLocker,
    isPopLocker: boolean,
  ) => {
    toast.loading('Claiming Rewards...');
    await claimStakingReward(pool, isPopLocker)
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success('Rewards Claimed!');
          getData();
          if (!localStorage.getItem('hideClaimModal')) {
            dispatch(
              setSingleActionModal({
                image: <img src="images/claim/popover.svg" className="px-6" />,
                title:
                  'Everytime you claim rewards, a vesting record is created.',
                children: (
                  <p className="text-sm text-gray-500">
                    You have just claimed 10% of your earned rewards. The rest
                    of the rewards will be claimable over the next 365 days.
                  </p>
                ),
                onConfirm: {
                  label: 'Close',
                  onClick: () => {
                    localStorage.setItem('hideClaimModal', 'true');
                    dispatch(setSingleActionModal(false));
                  },
                },
              }),
            );
          }
        });
      })
      .catch((err) => {
        toast.dismiss();
        if (err.data === undefined) {
          toast.error('An error occured');
        } else {
          toast.error(err.data.message.split("'")[1]);
        }
      });
  };

  const claimSingleEscrow = async (escrow: Escrow) => {
    toast.loading('Claiming Escrow...');
    await claimVestedPopFromEscrows([escrow.id])
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success('Claimed Escrow!');
        });
      })
      .catch((err) => {
        toast.dismiss();
        if (err.data === undefined) {
          toast.error('An error occured');
        } else {
          toast.error(err.data.message.split("'")[1]);
        }
      });
  };

  const claimAllEscrows = async () => {
    toast.loading('Claiming Escrows...');
    const escrowsIds = userEscrowsFetchResult?.data?.escrows.map(
      (escrow) => escrow.id,
    );
    const numberOfEscrows = escrowsIds ? escrowsIds.length : 0;
    if (numberOfEscrows && numberOfEscrows > 0) {
      await claimVestedPopFromEscrows(escrowsIds)
        .then((res) =>
          res.wait().then((res) => {
            toast.dismiss();
            toast.success('Claimed Escrows!');
          }),
        )
        .catch((err) => {
          toast.dismiss();
          if (err.data === undefined) {
            toast.error('An error occured');
          } else {
            toast.error(err.data.message.split("'")[1]);
          }
        });
    }
  };

  function incrementVisibleEscrows(visibleEscrows: number, escrowLength): void {
    let newVisibleEscrows = visibleEscrows + 5;
    if (newVisibleEscrows > escrowLength) {
      newVisibleEscrows = escrowLength;
    }
    setVisibleEscrows(newVisibleEscrows);
  }

  return (
    <div className="w-full h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
        <div className="flex flex-col mx-auto lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mt-14">
          <div className="w-1/3">
            <div className="">
              <h1 className="text-3xl font-medium">Rewards</h1>
              <p className="mt-2 text-lg text-gray-500">
                Claim your rewards and track your vesting records.
              </p>
            </div>
          </div>
          {!account && (
            <div className="w-full">
              <div className="w-full mt-10 mb-24 mr-12 bg-primaryLight rounded-5xl pt-44 pb-44 shadow-custom">
                <img
                  src="/images/claims-cat.svg"
                  alt="cat holding popcorn"
                  className="py-2 mx-auto transform scale-101"
                />
                <div className="grid justify-items-stretch">
                  <button
                    onClick={() => activate(connectors.Injected)}
                    className="mx-auto mt-12 bg-blue-600 border border-transparent justify-self-center rounded-2xl drop-shadow"
                    style={{ width: '368px', height: '60px' }}
                  >
                    <p className="font-bold text-white">Connect Wallet</p>
                  </button>
                </div>
              </div>
            </div>
          )}
          {account && (
            <div className="flex flex-row">
              <div className="w-1/3">
                <div className="flex items-stretch mt-10 mb-24 mr-12 bg-primaryLight rounded-5xl shadow-custom min-h-128 h-11/12 max-h-screen">
                  <img
                    src="/images/claims-cat.svg"
                    alt="cat holding popcorn"
                    className="self-center w-1/2 py-2 mx-auto transform scale-101"
                  />
                </div>
              </div>

              <div className="w-2/3 h-full mt-10 mb-8">
                <div className="mb-8">
                  <TokenInputToggle
                    toggled={showEscrows}
                    toggle={setShowEscrows}
                    labels={['Claim', 'Reward']}
                  />
                </div>
                {!showEscrows &&
                  stakingPoolsInfo &&
                  stakingPoolsInfo.length > 0 &&
                  stakingPoolsInfo?.map((poolInfo, index) => (
                    <ClaimCard
                      tokenName={poolInfo.stakedTokenName}
                      claimAmount={poolInfo.earned}
                      key={poolInfo.stakingContractAddress}
                      handler={poolClaimHandler}
                      pool={
                        poolInfo.stakedTokenName === 'POP'
                          ? contracts.popStaking
                          : contracts.staking.find(
                              (stakingContract) =>
                                stakingContract.address ===
                                poolInfo.stakingContractAddress,
                            )
                      }
                      disabled={poolInfo.earned === 0}
                      isPopLocker={poolInfo.stakedTokenName === 'POP'}
                    />
                  ))}
                {showEscrows &&
                  userEscrowsFetchResult &&
                  userEscrowsFetchResult?.data &&
                  !userEscrowsFetchResult?.error && (
                    <div>
                      <div
                        className={`flex flex-row justify-between px-8 py-6 w-full bg-rewardsBg rounded-t-3xl`}
                      >
                        <div className="flex flex-row">
                          <h1
                            className={`text-3xl font-bold text-gray-500 my-auto`}
                          >
                            Vesting Records
                          </h1>
                        </div>
                        <div className="flex flex-row my-auto">
                          <h1
                            className={`text-3xl font-bold text-gray-900 my-auto mr-8`}
                          >
                            {bigNumberToNumber(
                              userEscrowsFetchResult?.data?.totalClaimablePop,
                            ).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{' '}
                            POP
                          </h1>
                          <button
                            onClick={() => claimAllEscrows()}
                            className="mx-auto my-auto bg-blue-600 border border-transparent rounded-full justify-self-center shadow-custom py-3 px-10"
                          >
                            <p className="font-bold text-white">Claim All</p>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        {userEscrowsFetchResult?.data?.escrows
                          .slice(0, visibleEscrows)
                          .map((vestingEscrow, index) => {
                            return (
                              <VestingRecordComponent
                                vestingEscrow={vestingEscrow}
                                index={index}
                                claim={claimSingleEscrow}
                                key={vestingEscrow.end.toString()}
                              />
                            );
                          })}
                      </div>

                      <div
                        className={`flex flex-row justify-center px-8 py-4 w-full bg-rewardsBg mx-auto rounded-b-3xl`}
                      >
                        {userEscrowsFetchResult?.data?.escrows?.length > 0 &&
                          userEscrowsFetchResult?.data?.escrows?.length >
                            visibleEscrows && (
                            <div
                              className="flex flex-row items-center justify-center cursor-pointer group"
                              onClick={() =>
                                incrementVisibleEscrows(
                                  visibleEscrows,
                                  userEscrowsFetchResult?.data?.escrows?.length,
                                )
                              }
                            >
                              <h1 className="text-base font-semibold group-hover:text-blue-600">
                                Load more
                              </h1>
                              <ChevronDown className="w-4 h-4 ml-2 group-hover:text-blue-600" />
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                {loading && (
                  <div className="w-full h-full flex justify-center mt-24">
                    <LoadingSpinner size="w-96 h-96" cat />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
