import { PopLocker, Staking, XPopRedemption__factory } from "@popcorn/hardhat/typechain";
import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { CardLoader } from "components/CardLoader";
import AirDropClaim from "components/Rewards/AirdropClaim";
import ClaimCard from "components/Rewards/ClaimCard";
import { NotAvailable } from "components/Rewards/NotAvailable";
import RewardSummaryCard from "components/Rewards/RewardSummaryCard";
import VestingRecordComponent from "components/Rewards/VestingRecord";
import SecondaryActionButton from "components/SecondaryActionButton";
import TabSelector from "components/TabSelector";
import { setMultiChoiceActionModal, setSingleActionModal } from "context/actions";
import { store } from "context/store";
import { BigNumber, ethers } from "ethers";
import useGetMultipleStakingPools from "hooks/staking/useGetMultipleStakingPools";
import usePopLocker from "hooks/staking/usePopLocker";
import useClaimEscrows from "hooks/useClaimEscrows";
import useClaimStakingReward from "hooks/useClaimStakingReward";
import useGetUserEscrows, { Escrow } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import { ChevronDown } from "react-feather";
import { toast } from "react-hot-toast";
import { SWRResponse } from "swr";
import useBalanceAndAllowance from "../../hooks/staking/useBalanceAndAllowance";
import useERC20 from "../../hooks/tokens/useERC20";

export enum Tabs {
  Staking = "Staking Rewards",
  Airdrop = "Airdrop Redemption",
  Vesting = "Vesting Records",
}

export default function index(): JSX.Element {
  const { account, signerOrProvider, signer, chainId, connect, contractAddresses, onContractSuccess, onContractError } =
    useWeb3();
  const { dispatch } = useContext(store);
  const [visibleEscrows, setVisibleEscrows] = useState<number>(5);
  const xPopRedemption = useMemo(() => {
    if (contractAddresses.xPopRedemption) {
      return XPopRedemption__factory.connect(contractAddresses.xPopRedemption, signerOrProvider);
    }
  }, [chainId, account, signerOrProvider]);
  const pop = useERC20(contractAddresses.pop);
  const xPop = useERC20(contractAddresses.xPop);
  const { data: popLocker, mutate: revalidatePopLocker } = usePopLocker(contractAddresses.popStaking);
  const { data: stakingPools, mutate: revalidateStakingPools } = useGetMultipleStakingPools(contractAddresses.staking);
  const balancesXPop = useBalanceAndAllowance(xPop, account, contractAddresses?.xPopRedemption);
  const balancesPop = useBalanceAndAllowance(pop, account, contractAddresses?.xPopRedemption);

  const [tabSelected, setTabSelected] = useState<Tabs>(Tabs.Staking);
  const [availableTabs, setAvailableTabs] = useState<Tabs[]>([]);
  const isSelected = (tab: Tabs) => tabSelected === tab;

  const claimStakingReward = useClaimStakingReward();
  const claimVestedPopFromEscrows = useClaimEscrows();

  const revalidate = () => {
    revalidatePopLocker();
    revalidateStakingPools();
    balancesXPop.revalidate();
    balancesPop.revalidate();
  };

  useEffect(() => {
    if (chainId === ChainId.BNB) {
      setTabSelected(Tabs.Airdrop);
    }
  }, []);

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

  const userEscrowsFetchResult: SWRResponse<
    { escrows: Escrow[]; totalClaimablePop: BigNumber; totalVestingPop: BigNumber },
    any
  > = useGetUserEscrows(chainId);

  const poolClaimHandler = async (pool: Staking | PopLocker, isPopLocker: boolean) => {
    toast.loading("Claiming Rewards...");
    claimStakingReward(pool, isPopLocker).then(
      (res) =>
        onContractSuccess(res, "Rewards Claimed!", () => {
          revalidate();

          if (!localStorage.getItem("hideClaimModal")) {
            dispatch(
              setMultiChoiceActionModal({
                image: <img src="/images/modalImages/vestingImage.svg" />,
                title: "A Vesting Record is generated when you claim your staking rewards.",
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
        }),
      (err) => onContractError(err),
    );
  };

  const claimSingleEscrow = async (escrow: Escrow) => {
    toast.loading("Claiming Escrow...");
    claimVestedPopFromEscrows([escrow.id]).then(
      (res) => onContractSuccess(res, "Claimed Escrow!", revalidate),
      (err) => onContractError(err),
    );
  };

  const claimAllEscrows = async () => {
    toast.loading("Claiming Escrows...");
    const escrowsIds = userEscrowsFetchResult?.data?.escrows.map((escrow) => escrow.id);
    const numberOfEscrows = escrowsIds ? escrowsIds.length : 0;
    if (numberOfEscrows && numberOfEscrows > 0) {
      claimVestedPopFromEscrows(escrowsIds).then(
        (res) => onContractSuccess(res, "Claimed Escrows!", revalidate),
        (err) => onContractError(err),
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
    toast.loading("Approving xPOP...");
    await xPop.contract
      .connect(signer)
      .approve(contractAddresses.xPopRedemption, ethers.constants.MaxUint256)
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success("xPOP approved!");
          revalidate();
        });
      })
      .catch((err) => {
        toast.dismiss();
        if (err.data === undefined) {
          toast.error("An error occured");
        } else {
          toast.error(err.data.message.split("'")[1]);
        }
      });
  }
  async function redeemXpop(amount: BigNumber): Promise<void> {
    toast.loading("Redeeming xPOP...");
    await xPopRedemption
      .connect(signer)
      .redeem(amount)
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success("xPOP redeemed!");
          revalidate();
          postRedeemSuccess();
        });
      })
      .catch((err) => {
        toast.dismiss();
        revalidate();
        if (err.data === undefined) {
          toast.error("An error occured");
        } else {
          toast.error(err.data.message.split("'")[1]);
        }
      });
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
              onClick={() => connect()}
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
            <div className="rounded-lg p-8 bg-customYellow md:h-104 flex flex-row md:flex-col justify-between">
              <p className="text-2xl md:text-8xl leading-6 md:leading-13">
                Connect <br />
                Deposit <br />
                Do well <br />
                Do good
              </p>
              <div className="flex flex-col md:flex-row justify-end">
                <img src="/images/smiley.svg" alt="" />
              </div>
            </div>
          </div>
          <div className="flex flex-col col-span-12 md:col-span-8 md:mb-8 mt-10">
            <div>
              <TabSelector activeTab={tabSelected} setActiveTab={setTabSelected} availableTabs={availableTabs} />
            </div>
            {isSelected(Tabs.Staking) && stakingVisible(chainId) && !!popLocker && (
              <ClaimCard
                tokenName={popLocker.stakingToken.name}
                claimAmount={popLocker.earned}
                key={popLocker.address}
                handler={poolClaimHandler}
                pool={popLocker.contract}
                disabled={popLocker.earned?.isZero()}
                isPopLocker={true}
              />
            )}

            {isSelected(Tabs.Staking) && !stakingVisible(chainId) && (
              <NotAvailable
                title="No Staking Rewards"
                body="Staking rewards are currently unavailable on this network"
              />
            )}

            {isSelected(Tabs.Staking) && stakingVisible(chainId) && !popLocker && !stakingPools && (
              <div className="mt-10">
                <CardLoader />
              </div>
            )}

            {isSelected(Tabs.Airdrop) && xPop && pop ? (
              <div className="mt-8">
                <AirDropClaim
                  approve={approveXpopRedemption}
                  redeem={redeemXpop}
                  balances={[balancesXPop, balancesPop]}
                  tokens={[xPop, pop]}
                />
              </div>
            ) : (
              <NotAvailable
                title="No airdrops"
                body="No airdrops found on this network"
                visible={isSelected(Tabs.Airdrop)}
              />
            )}
            {isSelected(Tabs.Staking) &&
              stakingVisible(chainId) &&
              stakingPools &&
              stakingPools.length > 0 &&
              stakingPools?.map((poolInfo, index) => (
                <ClaimCard
                  tokenName={poolInfo.stakingToken.name}
                  claimAmount={poolInfo.earned}
                  key={poolInfo.address}
                  handler={poolClaimHandler}
                  pool={poolInfo.contract}
                  disabled={poolInfo.earned?.isZero()}
                  isPopLocker={poolInfo.stakingToken.address === contractAddresses.pop}
                />
              ))}

            {isSelected(Tabs.Staking) && (stakingPools?.length || -1) >= 0 && !popLocker && (
              <NotAvailable
                title="No Staking Pools"
                body="There are no staking pools found on this network"
                visible={isSelected(Tabs.Staking)}
              />
            )}
            {isSelected(Tabs.Vesting) && (
              <div className="flex flex-col h-full">
                {!userEscrowsFetchResult ||
                  !userEscrowsFetchResult?.data ||
                  userEscrowsFetchResult?.error ||
                  userEscrowsFetchResult?.data?.totalClaimablePop?.isZero() ? (
                  <NotAvailable title="No Records Available" body="No vesting records available" />
                ) : (
                  <>
                    <div>
                      <div className="flex flex-col h-full">
                        <div className="flex flex-col md:flex-row gap-8 w-full my-8">
                          <RewardSummaryCard
                            content={`${formatAndRoundBigNumber(userEscrowsFetchResult?.data?.totalVestingPop, 18)} POP`}
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
                            content={`${formatAndRoundBigNumber(userEscrowsFetchResult?.data?.totalClaimablePop, 18)} POP`}
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
                          {userEscrowsFetchResult?.data?.escrows?.length > 0 &&
                            userEscrowsFetchResult?.data?.escrows?.length > visibleEscrows && (
                              <div
                                className={`flex flex-row justify-center px-8 py-4 w-full bg-rewardsBg mx-auto rounded-b-3xl`}
                              >
                                <div
                                  className="flex flex-row items-center justify-center cursor-pointer group"
                                  onClick={() =>
                                    incrementVisibleEscrows(
                                      visibleEscrows,
                                      userEscrowsFetchResult?.data?.escrows?.length,
                                    )
                                  }
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
            {!popLocker && (stakingPools?.length || -1) >= 0 && (
              <div className="mt-10">
                <ContentLoader viewBox="0 0 450 400" backgroundColor={"#EBE7D4"} foregroundColor={"#d7d5bc"}>
                  {/*eslint-disable */}
                  <rect x="0" y="0" rx="8" ry="8" width="450" height="108" />
                  <rect x="0" y="115" rx="8" ry="8" width="450" height="108" />
                  <rect x="0" y="230" rx="8" ry="8" width="450" height="108" />
                  {/*eslint-enable */}
                </ContentLoader>
              </div>
            )}
          </div>
        </div>
      )}
      {account && (
        <div className="py-6 hidden md:block">
          <img src="/images/nature.png" alt="" className=" rounded-lg w-full object-cover" />
        </div>
      )}
    </>
  );
}
