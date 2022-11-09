import { PopLocker, Staking, XPopRedemption__factory } from "@popcorn/hardhat/typechain";
import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import AirDropClaim from "@popcorn/app/components/Rewards/AirdropClaim";
import ClaimCard from "@popcorn/app/components/Rewards/ClaimCard";
import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";
import RewardSummaryCard from "@popcorn/app/components/Rewards/RewardSummaryCard";
import VestingRecordComponent from "@popcorn/app/components/Rewards/VestingRecord";
import SecondaryActionButton from "@popcorn/app/components/SecondaryActionButton";
import TabSelector from "@popcorn/app/components/TabSelector";
import { setMultiChoiceActionModal, setSingleActionModal } from "@popcorn/app/context/actions";
import { store } from "@popcorn/app/context/store";
import { BigNumber, ethers } from "ethers";
import useClaimEscrows from "@popcorn/app/hooks/useClaimEscrows";
import useClaimStakingReward from "@popcorn/app/hooks/useClaimStakingReward";
import { Escrow, useGetUserEscrows } from "@popcorn/app/hooks/useGetUserEscrows";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useTransaction } from "@popcorn/app/hooks/useTransaction";
import { useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import { ChevronDown } from "react-feather";
import { SWRResponse } from "swr";
import useBalanceAndAllowance from "@popcorn/app/hooks/staking/useBalanceAndAllowance";
import useERC20 from "@popcorn/app/hooks/tokens/useERC20";
import { useChainIdFromUrl } from "@popcorn/app/hooks/useChainIdFromUrl";
import useAllStakingContracts from "hooks/staking/useAllStakingContracts";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";

export enum Tabs {
  Staking = "Staking Rewards",
  Airdrop = "Airdrop Redemption",
  Vesting = "Vesting Records",
}

export default function RewardsPage(): JSX.Element {
  const { account, signer, connect, chains } = useWeb3();
  const chainId = useChainIdFromUrl();
  const rpcProvider = useRpcProvider(chainId)
  const {
    xPopRedemption: xPopRedemptionAddress,
    popStaking,
    xPop: xPopAddress,
    rewardsEscrow,
    pop: popAddress,
    vaultsRewardsEscrow,
  } = useDeployment(chainId);

  const {
    rewardsEscrow: ethereumRewardsEscrow,
    vaultsRewardsEscrow: ethereumVaultsRewardsEscrow,
  } = useDeployment(ChainId.Ethereum);
  const {
    rewardsEscrow: polygonRewardsEscrow,
    vaultsRewardsEscrow: polygonVaultsRewardsEscrow,
  } = useDeployment(ChainId.Polygon);

  const { dispatch } = useContext(store);
  const [visibleEscrows, setVisibleEscrows] = useState<number>(5);
  const xPopRedemption = useMemo(() => {
    if (xPopRedemptionAddress) {
      return XPopRedemption__factory.connect(xPopRedemptionAddress, rpcProvider);
    }
  }, [rpcProvider, xPopRedemptionAddress]);

  const pop = useERC20(popAddress, chainId);
  const xPop = useERC20(xPopAddress, chainId);

  const stakingContracts = useAllStakingContracts();

  const balancesXPop = useBalanceAndAllowance(xPop?.address, account, xPopRedemptionAddress, chainId);
  const balancesPop = useBalanceAndAllowance(pop?.address, account, xPopAddress, chainId);

  const [tabSelected, setTabSelected] = useState<Tabs>(Tabs.Staking);
  const [availableTabs, setAvailableTabs] = useState<Tabs[]>([]);
  const isSelected = (tab: Tabs) => tabSelected === tab;

  const claimStakingReward = useClaimStakingReward();
  const claimVestedPopFromEscrows = useClaimEscrows(rewardsEscrow, chainId);
  const transaction = useTransaction(chainId);

  const revalidate = () => {
    balancesXPop.revalidate();
    balancesPop.revalidate();
  };

  useEffect(() => {
    if (chainId === ChainId.BNB) {
      setTabSelected(Tabs.Airdrop);
    }
  }, [chainId]);

  useEffect(() => {
    if (shouldAirdropVisible(chainId)) {
      setAvailableTabs([Tabs.Staking, Tabs.Airdrop, Tabs.Vesting]);
    } else {
      setAvailableTabs([Tabs.Staking, Tabs.Vesting]);
    }
  }, [chainId]);

  const shouldAirdropVisible = (chainId) =>
    [ChainId.Arbitrum, ChainId.Polygon, ChainId.Hardhat, ChainId.BNB, ChainId.Localhost].includes(chainId);

  const stakingVisible = (chainId) => ![ChainId.Arbitrum, ChainId.BNB].includes(chainId);

  const ethereumUserEscrowsFetchResult: SWRResponse<
    { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
    any
  > = useGetUserEscrows(ethereumRewardsEscrow, account, ChainId.Ethereum);
  const ethereumUserVaultsEscrowsFetchResults: SWRResponse<
    { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
    any
  > = useGetUserEscrows(ethereumVaultsRewardsEscrow, account, ChainId.Ethereum);

  const polygonUserEscrowsFetchResult: SWRResponse<
    { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
    any
  > = useGetUserEscrows(polygonRewardsEscrow, account, ChainId.Polygon);
  const polygonUserVaultsEscrowsFetchResults: SWRResponse<
    { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
    any
  > = useGetUserEscrows(polygonVaultsRewardsEscrow, account, ChainId.Polygon);

  // const localhostUserEscrowsFetchResult: SWRResponse<
  //   { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
  //   any
  // > = useGetUserEscrows(rewardsEscrow, account, ChainId.Localhost);
  // const localhostUserVaultsEscrowsFetchResults: SWRResponse<
  //   { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
  //   any
  // > = useGetUserEscrows(vaultsRewardsEscrow, account, ChainId.Localhost);

  const [userEscrowData, setUserEscrowData] =
    useState<{ escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber }>();

  useEffect(() => {
    if (!ethereumUserEscrowsFetchResult?.data && !ethereumUserVaultsEscrowsFetchResults?.data &&
      !polygonUserEscrowsFetchResult?.data && !polygonUserVaultsEscrowsFetchResults?.data)
    // &&(chainId === ChainId.Localhost && !localhostUserEscrowsFetchResult?.data && !localhostUserVaultsEscrowsFetchResults?.data)) 
    { return; }
    setUserEscrowData({
      escrows: []
        .concat(ethereumUserEscrowsFetchResult?.data?.escrows || [])
        .concat(ethereumUserVaultsEscrowsFetchResults?.data?.escrows || [])
        .concat(polygonUserEscrowsFetchResult?.data?.escrows || [])
        .concat(polygonUserVaultsEscrowsFetchResults?.data?.escrows || []),
      // .concat(localhostUserEscrowsFetchResult?.data?.escrows || [])
      // .concat(localhostUserVaultsEscrowsFetchResults?.data?.escrows || []),
      totalClaimablePop: BigNumber.from("0")
        .add(ethereumUserEscrowsFetchResult?.data?.totalClaimablePop || "0")
        .add(ethereumUserVaultsEscrowsFetchResults?.data?.totalClaimablePop || "0")
        .add(polygonUserEscrowsFetchResult?.data?.totalClaimablePop || "0")
        .add(polygonUserVaultsEscrowsFetchResults?.data?.totalClaimablePop || "0"),
      // .add(localhostUserEscrowsFetchResult?.data?.totalClaimablePop || "0")
      // .add(localhostUserVaultsEscrowsFetchResults?.data?.totalClaimablePop || "0"),
      totalVestingPop: BigNumber.from("0")
        .add(ethereumUserEscrowsFetchResult?.data?.totalVestingPop || "0")
        .add(ethereumUserVaultsEscrowsFetchResults?.data?.totalVestingPop || "0")
        .add(polygonUserEscrowsFetchResult?.data?.totalVestingPop || "0")
        .add(polygonUserVaultsEscrowsFetchResults?.data?.totalVestingPop || "0"),
      // .add(localhostUserEscrowsFetchResult?.data?.totalVestingPop || "0")
      // .add(localhostUserVaultsEscrowsFetchResults?.data?.totalVestingPop || "0"),
    });
  }, [chainId, ethereumUserEscrowsFetchResult?.data, ethereumUserVaultsEscrowsFetchResults?.data,
    polygonUserEscrowsFetchResult?.data, polygonUserVaultsEscrowsFetchResults?.data,]);
  //localhostUserEscrowsFetchResult?.data, localhostUserVaultsEscrowsFetchResults?.data, ]);

  const poolClaimHandler = async (pool: Staking | PopLocker, isPopLocker: boolean) => {
    console.log(pool)
    transaction(
      () => pool.connect(signer).getReward(isPopLocker ? account : null),
      "Claiming Reward...",
      "Rewards Claimed!",
      () => {
        if (!localStorage.getItem("hideClaimModal")) {
          dispatch(
            setMultiChoiceActionModal({
              image: <img src="/images/modalImages/vestingImage.svg" />,
              title: "Sweet!",
              content:
                "You have just claimed 10% of your earned rewards. The rest of the rewards will be claimable over the next 365 days",
              onConfirm: {
                label: "Continue",
                onClick: () => dispatch(setMultiChoiceActionModal(false)),
              },
              onDismiss: {
                onClick: () => {
                  dispatch(setMultiChoiceActionModal(false));
                },
              },
              onDontShowAgain: {
                label: "Do not remind me again",
                onClick: () => {
                  localStorage.setItem("hideClaimModal", "true");
                  dispatch(setMultiChoiceActionModal(false));
                },
              },
            }),
          );
        }
      },
    );
  };

  const claimSingleEscrow = async (escrow: Escrow) => {
    transaction(
      async () => claimVestedPopFromEscrows([escrow.id]),
      "Claiming Escrow...",
      "Claimed Escrow!",
      revalidate,
    );
  };

  const claimAllEscrows = async () => {
    const escrowsIds = userEscrowData?.escrows.map((escrow) => escrow.id);
    const numberOfEscrows = escrowsIds ? escrowsIds.length : 0;
    if (numberOfEscrows && numberOfEscrows > 0) {
      transaction(
        async () => claimVestedPopFromEscrows(escrowsIds),
        "Claiming Escrows...",
        "Claimed Escrows!",
        revalidate,
      );
    }
  };

  function incrementVisibleEscrows(visibleEscrows: number, escrowLength): void {
    let newVisibleEscrows = visibleEscrows + 5;
    if (newVisibleEscrows > escrowLength) {
      newVisibleEscrows = escrowLength;
    }
    setVisibleEscrows(newVisibleEscrows);
  }

  async function approveXpopRedemption(): Promise<void> {
    transaction(
      async () => xPop.contract.connect(signer).approve(xPopRedemptionAddress, ethers.constants.MaxUint256),
      "Approving xPOP...",
      "xPOP approved!",
      revalidate,
    );
  }
  async function redeemXpop(amount: BigNumber): Promise<void> {
    transaction(
      async () => xPopRedemption.connect(signer).redeem(amount),
      "Redeeming xPOP...",
      "xPOP redeemed!",
      () => {
        revalidate();
        postRedeemSuccess();
      },
    );
  }

  const postRedeemSuccess = () => {
    dispatch(
      setSingleActionModal({
        title: "You have just redeemed your POP",
        children: (
          <p>
            Your recently redeemed POP will be vested linearly over 2 years. Go to{" "}
            <span
              className="text-customPurple inline cursor-pointer"
              onClick={() => {
                setTabSelected(Tabs.Vesting);
                dispatch(setSingleActionModal(false));
              }}
            >
              Vesting Records
            </span>{" "}
            to claim your POP
          </p>
        ),

        image: <img src="/images/modalImages/redeemed.svg" />,
        onConfirm: {
          label: "Close",
          onClick: () => dispatch(setSingleActionModal(false)),
        },
      }),
    );
  };

  return (
    <>
      <div className="grid grid-cols-12 md:gap-8 laptop:gap-14">
        <div className="col-span-12 md:col-span-3">
          <h1 className="text-6xl leading-12 text-black">Rewards</h1>
          <p className="mt-4 leading-5 text-black">Claim your rewards and track your vesting records.</p>
          {!account && (
            <div
              className=" rounded-lg md:border md:border-customLightGray px-0 pt-4 md:p-6 md:pb-0 mt-6"
              onClick={connect}
              role="button"
            >
              <p className="text-gray-900 text-3xl leading-8 hidden md:block">Connect your wallet</p>
              <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-6 md:px-0 py-6 md:py-2 mb-1 md:mt-4">
                <div className="hidden md:block">
                  <SecondaryActionButton label="Connect" />
                </div>
                <div className="md:hidden">
                  <SecondaryActionButton label="Connect Wallet" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 md:col-span-6 md:col-end-13 gap-6 hidden md:grid grid-cols-6">
          <div className="rounded-lg bg-rewardsGreen col-span-1 h-88"></div>

          <div className="col-span-5 rounded-lg bg-rewardsLightGreen flex justify-end items-end p-8">
            <img src="/images/twoFingers.svg" className=" h-48 w-48" />
          </div>
        </div>
      </div>

      {account && (
        <div className="grid grid-cols-12 md:gap-8 mt-16 md:mt-20">
          <div className="col-span-12 md:col-span-4">
            <ConnectDepositCard extraClasses="md:h-104" />
          </div>
          <div className="flex flex-col col-span-12 md:col-span-8 md:mb-8 mt-10">
            <div>
              <TabSelector activeTab={tabSelected} setActiveTab={setTabSelected} availableTabs={availableTabs} />
            </div>
            {isSelected(Tabs.Staking) &&
              stakingVisible(chainId) &&
              stakingContracts?.popStaking &&
              stakingContracts?.popStaking.length > 0 &&
              stakingContracts?.popStaking?.map(popLocker =>
                <ClaimCard
                  key={popLocker?.address}
                  tokenAddress={popLocker?.stakingToken?.address}
                  chainId={popLocker?.contract?.provider?._network?.id}
                  tokenName={popLocker?.stakingToken?.name}
                  claimAmount={popLocker?.earned}
                  handler={poolClaimHandler}
                  pool={popLocker?.contract}
                  disabled={popLocker?.earned?.isZero()}
                  isPopLocker
                />
              )}

            {isSelected(Tabs.Staking) &&
              stakingVisible(chainId) &&
              stakingContracts?.stakingPools &&
              stakingContracts?.stakingPools.length > 0 &&
              stakingContracts?.stakingPools?.map((poolInfo, index) => (
                <ClaimCard
                  key={poolInfo?.address}
                  tokenAddress={poolInfo?.stakingToken?.address}
                  chainId={poolInfo?.contract?.provider?._network.id}
                  tokenName={poolInfo?.stakingToken?.name}
                  claimAmount={poolInfo?.earned}
                  handler={poolClaimHandler}
                  pool={poolInfo?.contract}
                  disabled={poolInfo?.earned?.isZero()}
                />
              ))}

            {isSelected(Tabs.Vesting) && (
              <div className="flex flex-col h-full">
                {!userEscrowData ||
                  ethereumUserEscrowsFetchResult?.error ||
                  ethereumUserVaultsEscrowsFetchResults?.error ||
                  polygonUserEscrowsFetchResult?.error ||
                  polygonUserVaultsEscrowsFetchResults?.error ||
                  userEscrowData?.totalClaimablePop?.isZero() ? (
                  <NotAvailable title="No Records Available" body="No vesting records available" />
                ) : (
                  <>
                    <div>
                      <div className="flex flex-col h-full">
                        <div className="flex flex-col md:flex-row gap-8 md:gap-0 md:space-x-8 w-full my-8">
                          <RewardSummaryCard
                            content={`${formatAndRoundBigNumber(userEscrowData?.totalVestingPop, 18)} POP`}
                            title={"Total Vesting"}
                            iconUri="/images/lock.svg"
                            infoIconProps={{
                              id: "Total Vesting",
                              title: "Total Vesting",
                              content:
                                "Every time you claim rewards a new 'Vesting Record' below will be added. Rewards in each 'Vesting Record' unlock over time. Come back periodically to claim new rewards as they unlock.",
                              classExtras: "h-5 w-5 ml-2",
                            }}
                          />
                          <RewardSummaryCard
                            content={`${formatAndRoundBigNumber(userEscrowData?.totalClaimablePop, 18)} POP`}
                            title={"Total Claimable"}
                            iconUri="/images/yellowCircle.svg"
                            button={true}
                            handleClick={() => claimAllEscrows()}
                            infoIconProps={{
                              id: "Total Claimable",
                              title: "Total Claimable",
                              content:
                                "This describes the total amount of Rewards that you can currently claim across all 'Vesting Records'.",
                              classExtras: "h-5 w-5 ml-2",
                            }}
                          />
                        </div>
                        <div className="flex flex-col border-t border-customLightGray overflow-hidden">
                          {userEscrowData?.escrows.slice(0, visibleEscrows).map((vestingEscrow, index) => {
                            return (
                              <VestingRecordComponent
                                vestingEscrow={vestingEscrow}
                                index={index}
                                claim={claimSingleEscrow}
                                key={vestingEscrow.end.toString()}
                              />
                            );
                          })}
                          {userEscrowData?.escrows?.length > 0 && userEscrowData?.escrows?.length > visibleEscrows && (
                            <div
                              className={`flex flex-row justify-center px-8 py-4 w-full bg-rewardsBg mx-auto rounded-b-3xl`}
                            >
                              <div
                                className="flex flex-row items-center justify-center cursor-pointer group"
                                onClick={() => incrementVisibleEscrows(visibleEscrows, userEscrowData?.escrows?.length)}
                              >
                                <h1 className="text-base font-medium group-hover:text-blue-600">Load more</h1>
                                <ChevronDown className="w-4 h-4 ml-2 group-hover:text-blue-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
