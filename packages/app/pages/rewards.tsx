import { Web3Provider } from "@ethersproject/providers";
import { PopLocker, Staking } from "@popcorn/hardhat/typechain";
import { getEarned, getSingleStakingPoolInfo, StakingPoolInfo } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import Navbar from "components/NavBar/NavBar";
import AirDropClaim from "components/Rewards/AirdropClaim";
import ClaimCard from "components/Rewards/ClaimCard";
import VestingRecordComponent from "components/Rewards/VestingRecord";
import TabSelector from "components/TabSelector";
import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import { ContractsContext } from "context/Web3/contracts";
import { BigNumber, ethers } from "ethers";
import { formatStakedAmount } from "helper/formatStakedAmount";
import useWeb3Callbacks from "helper/useWeb3Callbacks";
import useClaimEscrows from "hooks/useClaimEscrows";
import useClaimStakingReward from "hooks/useClaimStakingReward";
import useGetUserEscrows, { Escrow } from "hooks/useGetUserEscrows";
import { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import { ChevronDown } from "react-feather";
import { toast, Toaster } from "react-hot-toast";
import { SWRResponse } from "swr";
import { ChainId, connectors } from "../context/Web3/connectors";

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts, butterDependencyContracts } = useContext(ContractsContext);
  const { account, library, chainId, activate } = context;
  const { dispatch } = useContext(store);

  const [stakingPoolsInfo, setStakingPoolsInfo] = useState<StakingPoolInfo[]>();
  const [visibleEscrows, setVisibleEscrows] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [balances, setBalances] = useState<{
    wallet: BigNumber;
    allowance: BigNumber;
  }>();
  const [tabSelected, setTabSelected] = useState<number>(0);
  const [availableTabs, setAvailableTabs] = useState([]);

  const claimStakingReward = useClaimStakingReward();
  const claimVestedPopFromEscrows = useClaimEscrows();
  const { onSuccess, onError } = useWeb3Callbacks();

  useEffect(() => {
    // Fetch Data
    if (account && contracts && contracts.xPop && contracts.xPopRedemption && shouldAirdropVisible(chainId)) {
      getXpopBalance();
    }
    if (account && contracts) {
      getData();
    }
  }, [account, contracts, chainId]);

  useEffect(() => {
    // Handle loading state
    if (stakingPoolsInfo) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [stakingPoolsInfo, balances]);

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

  async function getData(): Promise<void> {
    let newStakingPoolsInfo: StakingPoolInfo[] = [];
    const popStakingInfo = await getSingleStakingPoolInfo(
      contracts.popStaking,
      contracts,
      chainId,
      library,
      contracts.pop?.address,
      "Popcorn",
    );
    popStakingInfo.earned = await getEarned(contracts.popStaking, account, true);
    newStakingPoolsInfo.push(popStakingInfo);

    if (contracts.staking.length > 0) {
      await Promise.all(
        contracts.staking.map(async (stakingContract) => {
          newStakingPoolsInfo.push({
            ...(await getSingleStakingPoolInfo(
              stakingContract,
              contracts,
              chainId,
              library,
              null,
              null,
              butterDependencyContracts,
            )),
            earned: await getEarned(stakingContract, account, false),
          });
        }),
      );
    }

    setStakingPoolsInfo(newStakingPoolsInfo);
  }

  async function getXpopBalance(): Promise<void> {
    setBalances({
      allowance: await contracts.xPop.allowance(account, contracts.xPopRedemption.address),
      wallet: await contracts.xPop.balanceOf(account),
    });
  }

  const poolClaimHandler = async (pool: Staking | PopLocker, isPopLocker: boolean) => {
    toast.loading("Claiming Rewards...");
    claimStakingReward(pool, isPopLocker).then(
      (res) =>
        onSuccess(res, "Rewards Claimed!", () => {
          getData();
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
      (res) => onSuccess(res, "Claimed Escrow!", getData),
      (err) => onError(err),
    );
  };

  const claimAllEscrows = async () => {
    toast.loading("Claiming Escrows...");
    const escrowsIds = userEscrowsFetchResult?.data?.escrows.map((escrow) => escrow.id);
    const numberOfEscrows = escrowsIds ? escrowsIds.length : 0;
    if (numberOfEscrows && numberOfEscrows > 0) {
      claimVestedPopFromEscrows(escrowsIds).then(
        (res) => onSuccess(res, "Claimed Escrows!", getData),
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
    toast.loading("Approving XPOP...");
    await contracts.xPop
      .connect(library.getSigner())
      .approve(contracts.xPopRedemption.address, ethers.constants.MaxUint256)
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success("XPOP approved!");
          getXpopBalance();
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
    toast.loading("Redeeming XPOP...");
    await contracts.xPopRedemption
      .connect(library.getSigner())
      .redeem(amount)
      .then((res) => {
        res.wait().then((res) => {
          toast.dismiss();
          toast.success("XPOP redeemed!");
          getXpopBalance();
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
  }

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
                <div className="flex justify-center items-center p-10 mt-10 mb-8 mr-12 bg-primaryLight rounded-5xl shadow-custom min-h-128 h-11/12 max-h-screen">
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
                {!loading &&
                  availableTabs[tabSelected] === Tabs.Airdrop &&
                  (contracts?.xPopRedemption && balances ? (
                    <AirDropClaim approve={approveXpopRedemption} redeem={redeemXpop} balances={balances} />
                  ) : (
                    <div className="border-1 border-gray-200 rounded-5xl w-full h-full flex flex-col justify-center items-center bg-gray-50">
                      <img src="/images/emptyPopcorn.svg" className="h-1/2 w-1/2" />
                      <p className="mt-12 font-semibold text-2xl text-gray-900">No Airdrops</p>
                      <p className="mt-1 text-gray-900">No Airdrops found on this Network</p>
                    </div>
                  ))}
                {!loading &&
                  availableTabs[tabSelected] === Tabs.Staking &&
                  stakingPoolsInfo &&
                  stakingPoolsInfo.length > 0 &&
                  stakingPoolsInfo?.map((poolInfo, index) => (
                    <ClaimCard
                      tokenName={poolInfo.stakedTokenName}
                      claimAmount={poolInfo.earned}
                      key={poolInfo.stakingContractAddress}
                      handler={poolClaimHandler}
                      pool={
                        poolInfo.stakedTokenName === "Popcorn"
                          ? contracts.popStaking
                          : contracts.staking.find(
                              (stakingContract) => stakingContract.address === poolInfo.stakingContractAddress,
                            )
                      }
                      disabled={poolInfo.earned.isZero()}
                      isPopLocker={poolInfo.stakedTokenName === "Popcorn"}
                    />
                  ))}
                {!loading && availableTabs[tabSelected] === Tabs.Vesting && (
                  <div className="flex flex-col h-full">
                    {!userEscrowsFetchResult ||
                    !userEscrowsFetchResult?.data ||
                    userEscrowsFetchResult?.error ||
                    userEscrowsFetchResult?.data?.totalClaimablePop?.isZero() ? (
                      <div className="border-1 border-gray-200 rounded-5xl w-full h-full flex flex-col justify-center items-center bg-gray-50">
                        <img src="/images/emptyPopcorn.svg" className="h-1/2 w-1/2" />
                        <p className="mt-12 font-semibold text-2xl text-gray-900">No records available</p>
                        <p className="mt-1 text-gray-900">No vesting records found</p>
                      </div>
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
                {loading && (
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
