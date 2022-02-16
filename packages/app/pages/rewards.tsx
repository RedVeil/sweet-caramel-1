import { PopLocker, Staking } from "@popcorn/hardhat/typechain";
import Navbar from "components/NavBar/NavBar";
import AirDropClaim from "components/Rewards/AirdropClaim";
import ClaimCard from "components/Rewards/ClaimCard";
import { NotAvailable } from "components/Rewards/NotAvailable";
import VestingRecordComponent from "components/Rewards/VestingRecord";
import TabSelector from "components/TabSelector";
import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import { ContractsContext } from "context/Web3/contracts";
import { BigNumber, ethers } from "ethers";
import { formatStakedAmount } from "helper/formatStakedAmount";
import useWeb3Callbacks from "helper/useWeb3Callbacks";
import usePopLocker from "hooks/staking/usePopLocker";
import useStakingPools from "hooks/staking/useStakingPools";
import useClaimEscrows from "hooks/useClaimEscrows";
import useClaimStakingReward from "hooks/useClaimStakingReward";
import useGetUserEscrows, { Escrow } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import { ChevronDown } from "react-feather";
import { toast, Toaster } from "react-hot-toast";
import { SWRResponse } from "swr";
import { ChainId, connectors } from "../context/Web3/connectors";
import useBalanceAndAllowance from "../hooks/staking/useBalanceAndAllowance";
import useERC20 from "../hooks/tokens/useERC20";

export default function index(): JSX.Element {
  const { account, library, chainId, activate, contractAddresses } = useWeb3();
  const { contracts } = useContext(ContractsContext);
  const { dispatch } = useContext(store);

  const [visibleEscrows, setVisibleEscrows] = useState<number>(5);
  const { data: pop } = useERC20(contractAddresses.pop);
  const { data: xPop } = useERC20(contractAddresses.xPop);
  const { data: popLocker, revalidate: revalidatePopLocker } = usePopLocker(contractAddresses.popStaking);
  const { data: stakingPools, revalidate: revalidateStakingPools } = useStakingPools(contractAddresses.staking);
  const balancesXPop = useBalanceAndAllowance(xPop, account, contracts?.xPopRedemption?.address);
  const balancesPop = useBalanceAndAllowance(pop, account, contracts?.xPopRedemption?.address);

  const [tabSelected, setTabSelected] = useState<number>(0);
  const [availableTabs, setAvailableTabs] = useState([]);

  const claimStakingReward = useClaimStakingReward();
  const claimVestedPopFromEscrows = useClaimEscrows();
  const { onSuccess, onError } = useWeb3Callbacks();

  const revalidate = () => {
    revalidatePopLocker();
    revalidateStakingPools();
    balancesXPop.revalidate();
    balancesPop.revalidate();
  };

  enum Tabs {
    Staking = "Staking Rewards",
    Airdrop = "Airdrop Redemption",
    Vesting = "Vesting Records",
  }

  useEffect(() => {
    if (shouldAirdropVisible(chainId)) {
      setAvailableTabs([Tabs.Staking, Tabs.Airdrop, Tabs.Vesting]);
    } else {
      setAvailableTabs([Tabs.Staking, Tabs.Vesting]);
    }
  }, [chainId]);

  const shouldAirdropVisible = (chainId) =>
    [ChainId.Arbitrum, ChainId.Polygon, ChainId.Hardhat, ChainId.Localhost].includes(chainId);

  const userEscrowsFetchResult: SWRResponse<{ escrows: Escrow[]; totalClaimablePop: BigNumber }, any> =
    useGetUserEscrows();

  const poolClaimHandler = async (pool: Staking | PopLocker, isPopLocker: boolean) => {
    toast.loading("Claiming Rewards...");
    claimStakingReward(pool, isPopLocker).then(
      (res) =>
        onSuccess(res, "Rewards Claimed!", () => {
          revalidate();

          if (!localStorage.getItem("hideClaimModal")) {
            dispatch(
              setSingleActionModal({
                image: <img src="images/claim/popover.svg" className="px-6" />,
                title: "Everytime you claim rewards, a vesting record is created.",
                children: (
                  <p className="text-sm text-gray-500">
                    You have just claimed 10% of your earned rewards. The rest of the rewards will be claimable over the
                    next 365 days.
                  </p>
                ),
                onConfirm: {
                  label: "Close",
                  onClick: () => {
                    localStorage.setItem("hideClaimModal", "true");
                    dispatch(setSingleActionModal(false));
                  },
                },
              }),
            );
          }
        }),
      (err) => onError(err),
    );
  };

  const claimSingleEscrow = async (escrow: Escrow) => {
    toast.loading("Claiming Escrow...");
    claimVestedPopFromEscrows([escrow.id]).then(
      (res) => onSuccess(res, "Claimed Escrow!", revalidate),
      (err) => onError(err),
    );
  };

  const claimAllEscrows = async () => {
    toast.loading("Claiming Escrows...");
    const escrowsIds = userEscrowsFetchResult?.data?.escrows.map((escrow) => escrow.id);
    const numberOfEscrows = escrowsIds ? escrowsIds.length : 0;
    if (numberOfEscrows && numberOfEscrows > 0) {
      claimVestedPopFromEscrows(escrowsIds).then(
        (res) => onSuccess(res, "Claimed Escrows!", revalidate),
        (err) => onError(err),
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
    await contracts.xPop
      .connect(library.getSigner())
      .approve(contracts.xPopRedemption.address, ethers.constants.MaxUint256)
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
    await contracts.xPopRedemption
      .connect(library.getSigner())
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
            Your recently redeemed POP will be vested linearly over one year. Go to{" "}
            <span
              className="text-blue-600 inline cursor-pointer"
              onClick={() => {
                setTabSelected(2);
                dispatch(setSingleActionModal(false));
              }}
            >
              Vesting Records
            </span>{" "}
            to claim your POP
          </p>
        ),

        image: <img src="/images/claim/Group_842.png" />,
        onConfirm: {
          label: "Close",
          onClick: () => dispatch(setSingleActionModal(false)),
        },
      }),
    );
  };

  const isSelected = (tab: Tabs) => availableTabs[tabSelected] === tab;

  return (
    <div className="w-full h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
        <div className="flex flex-col mx-auto lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mt-14">
          <div className="text-center md:text-left md:w-1/3 mx-6 md:mx-0">
            <h1 className="page-title">Rewards</h1>
            <p className="mt-2 text-lg text-gray-500">Claim your rewards and track your vesting records.</p>
          </div>
          {!account && (
            <div className="w-full">
              <div className="hidden md:block w-full mt-10 mb-24 mr-12 bg-primaryLight rounded-5xl pt-44 pb-44 shadow-custom">
                <img
                  src="/images/claims-cat.svg"
                  alt="cat holding popcorn"
                  className="py-2 mx-auto transform scale-101"
                />
                <div className="grid justify-items-stretch">
                  <button
                    onClick={() => activate(connectors.Injected)}
                    className="mx-auto mt-12 bg-blue-600 border border-transparent justify-self-center rounded-2xl drop-shadow"
                    style={{ width: "368px", height: "60px" }}
                  >
                    <p className="font-bold text-white">Connect Wallet</p>
                  </button>
                </div>
              </div>
            </div>
          )}
          {account && (
            <div className="flex flex-row">
              <div className="hidden md:flex flex-col w-1/3">
                <div
                  className="flex justify-center items-center p-10 mt-10 mb-8 mr-12 bg-primaryLight rounded-5xl shadow-custom min-h-128 h-11/12 "
                  style={{ maxHeight: "75vh", minHeight: "75vh" }}
                >
                  <img
                    src="/images/claims-cat.svg"
                    alt="cat holding popcorn"
                    className="self-center w-full py-2 transform scale-101"
                  />
                </div>
              </div>
              <div className="flex flex-col w-full md:w-2/3 px-6 md:mx-0 mt-10 mb-8">
                <div className="mb-8">
                  <TabSelector activeTab={tabSelected} setActiveTab={setTabSelected} labels={availableTabs} />
                </div>
                {isSelected(Tabs.Staking) && !!popLocker && (
                  <ClaimCard
                    tokenName={popLocker.stakingToken.name} //TODO
                    claimAmount={popLocker.earned}
                    key={popLocker.address}
                    handler={poolClaimHandler}
                    pool={popLocker.contract}
                    disabled={popLocker.earned?.isZero()}
                    isPopLocker={true}
                  />
                )}

                {isSelected(Tabs.Airdrop) && xPop && pop ? (
                  <AirDropClaim
                    approve={approveXpopRedemption}
                    redeem={redeemXpop}
                    balances={[balancesXPop, balancesPop]}
                    tokens={[xPop, pop]}
                  />
                ) : (
                  <NotAvailable
                    title="No airdrops"
                    body="No airdrops found on this network"
                    visible={isSelected(Tabs.Airdrop)}
                  />
                )}
                {isSelected(Tabs.Staking) &&
                  stakingPools &&
                  stakingPools.length > 0 &&
                  stakingPools?.map((poolInfo, index) => (
                    <ClaimCard
                      tokenName={poolInfo.stakingToken.name} //TODO
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
                    title="No staking pools"
                    body="There are no staking pools found on this network"
                    visible={isSelected(Tabs.Staking)}
                  />
                )}
                {availableTabs[tabSelected] === Tabs.Vesting && (
                  <div className="flex flex-col h-full">
                    {!userEscrowsFetchResult ||
                    !userEscrowsFetchResult?.data ||
                    userEscrowsFetchResult?.error ||
                    userEscrowsFetchResult?.data?.totalClaimablePop?.isZero() ? (
                      <NotAvailable title="No records available" body="No vesting records available" />
                    ) : (
                      <>
                        <div>
                          <div className={`flex flex-row justify-between px-8 py-6 w-full bg-rewardsBg rounded-t-3xl`}>
                            <div className="flex flex-row">
                              <h1 className={`text-3xl font-medium text-gray-900 my-auto`}>Vesting Records</h1>
                            </div>
                            <div className="flex flex-row my-auto">
                              <h1 className={`text-3xl font-medium text-gray-900 my-auto mr-8`}>
                                {formatStakedAmount(userEscrowsFetchResult?.data?.totalClaimablePop)} POP
                              </h1>
                              <button
                                onClick={() => claimAllEscrows()}
                                className="mx-auto my-auto bg-blue-600 border border-transparent rounded-full justify-self-center shadow-custom py-3 px-10"
                              >
                                <p className="font-semibold text-lg text-white">Claim All</p>
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
                        </div>
                        <div
                          className={`flex flex-row justify-center px-8 py-4 w-full bg-rewardsBg mx-auto rounded-b-3xl`}
                        >
                          {userEscrowsFetchResult?.data?.escrows?.length > 0 &&
                            userEscrowsFetchResult?.data?.escrows?.length > visibleEscrows && (
                              <div
                                className="flex flex-row items-center justify-center cursor-pointer group"
                                onClick={() =>
                                  incrementVisibleEscrows(visibleEscrows, userEscrowsFetchResult?.data?.escrows?.length)
                                }
                              >
                                <h1 className="text-base font-medium group-hover:text-blue-600">Load more</h1>
                                <ChevronDown className="w-4 h-4 ml-2 group-hover:text-blue-600" />
                              </div>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {!popLocker && (stakingPools?.length || -1) >= 0 && (
                  <ContentLoader viewBox="0 0 450 400">
                    {/* eslint-disable */}
                    <rect x="0" y="0" rx="15" ry="15" width="450" height="108" />
                    <rect x="0" y="115" rx="15" ry="15" width="450" height="108" />
                    <rect x="0" y="230" rx="15" ry="15" width="450" height="108" />
                    {/* eslint-enable */}
                  </ContentLoader>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
