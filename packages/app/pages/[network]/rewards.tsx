import { PopLocker, Staking, XPopRedemption__factory } from "@popcorn/hardhat/typechain";
import { CardLoader } from "components/CardLoader";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import Navbar from "components/NavBar/NavBar";
import AirDropClaim from "components/Rewards/AirdropClaim";
import ClaimCard from "components/Rewards/ClaimCard";
import { NotAvailable } from "components/Rewards/NotAvailable";
import VestingRecordComponent from "components/Rewards/VestingRecord";
import TabSelector from "components/TabSelector";
import { setMultiChoiceActionModal, setSingleActionModal } from "context/actions";
import { store } from "context/store";
import { BigNumber, ethers } from "ethers";
import { formatStakedAmount } from "helper/formatStakedAmount";
import useGetMultipleStakingPools from "hooks/staking/useGetMultipleStakingPools";
import usePopLocker from "hooks/staking/usePopLocker";
import useClaimEscrows from "hooks/useClaimEscrows";
import useClaimStakingReward from "hooks/useClaimStakingReward";
import useGetUserEscrows, { Escrow } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import { ChevronDown } from "react-feather";
import { toast, Toaster } from "react-hot-toast";
import { SWRResponse } from "swr";
import { ChainId } from "../../context/Web3/connectors";
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
    if (chainId === ChainId.BinanceSmartChain) {
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
    [ChainId.Arbitrum, ChainId.Polygon, ChainId.Hardhat, ChainId.BinanceSmartChain, ChainId.Localhost].includes(
      chainId,
    );

  const stakingVisible = (chainId) => ![ChainId.Arbitrum, ChainId.BinanceSmartChain].includes(chainId);

  const userEscrowsFetchResult: SWRResponse<{ escrows: Escrow[]; totalClaimablePop: BigNumber }, any> =
    useGetUserEscrows();

  const poolClaimHandler = async (pool: Staking | PopLocker, isPopLocker: boolean) => {
    toast.loading("Claiming Rewards...");
    claimStakingReward(pool, isPopLocker).then(
      (res) =>
        onContractSuccess(res, "Rewards Claimed!", () => {
          revalidate();

          if (!localStorage.getItem("hideClaimModal")) {
            dispatch(
              setMultiChoiceActionModal({
                image: <img src="/images/claim/popover.png" className="px-6" />,
                title: "Everytime you claim rewards, a vesting record is created.",
                children: (
                  <p className="text-sm text-gray-500">
                    You have just claimed 10% of your earned rewards. The rest of the rewards will be claimable over the
                    next 365 days.
                  </p>
                ),
                onConfirm: {
                  label: "Close",
                  onClick: () => dispatch(setMultiChoiceActionModal(false)),
                },
                onDismiss: {
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
              className="text-blue-600 inline cursor-pointer"
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

        image: <img src="/images/claim/Group_842.png" />,
        onConfirm: {
          label: "Close",
          onClick: () => dispatch(setSingleActionModal(false)),
        },
      }),
    );
  };

  return (
    <div className="w-full h-full">
      <Navbar />
      <Toaster position="top-right" />
      <div className="flex flex-col mx-auto w-full md:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mt-14 pb-6">
        <div className="text-center md:text-left md:w-1/3 mx-6 md:mx-0">
          <h1 className="page-title">Rewards</h1>
          <p className="mt-2 text-lg text-gray-500">Claim your rewards and track your vesting records.</p>
        </div>
        {!account && (
          <div className="w-full mt-10 mb-24 md:mr-12 md:ml-0 bg-primaryLight rounded-5xl py-20 md:py-44 shadow-custom">
            <img
              src="/images/claims-cat.svg"
              alt="cat holding popcorn"
              className="py-2 mx-auto px-10 transform scale-101"
            />
            <div className="flex mx-10 justify-items-stretch">
              <button
                onClick={() => {
                  connect();
                }}
                className="mx-auto mt-12 bg-blue-600 border border-transparent justify-self-center rounded-2xl drop-shadow"
                style={{ width: "368px", height: "60px" }}
              >
                <p className="font-bold text-white">Connect Wallet</p>
              </button>
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
            <div className="flex flex-col w-full md:w-2/3 mt-10 mb-8">
              <div className="mb-8">
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
                  title="No staking rewards"
                  body="Staking rewards are currently unavailable on this network"
                />
              )}

              {isSelected(Tabs.Staking) && stakingVisible(chainId) && !popLocker && !stakingPools && <CardLoader />}

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
                  title="No staking pools"
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
                    <NotAvailable title="No records available" body="No vesting records available" />
                  ) : (
                    <>
                      <div>
                        <div className={`flex flex-row justify-between md:px-8 py-6 w-full bg-rewardsBg rounded-t-3xl`}>
                          <div className="flex flex-col md:flex-row">
                            <div className="flex flex-row">
                              <h1 className={`text-lg md:text-3xl font-medium text-gray-900 my-auto`}>
                                Vesting Records
                              </h1>
                              <InfoIconWithTooltip
                                classExtras="h-7 w-7 md:h-8 md:w-8 mt-1.5 md:mt-3 ml-1 md:ml-2"
                                id="1"
                                title="Vesting Records"
                                content="Here you can see all your vested POP rewards. Each of these Records will linearly unlock more POP over the span of 365 days. 'Unlock Ends' shows you when all POP will be unlocked from this Vesting Record. 'Total Tokens' is the total amount of POP that this record will unlock over time."
                              />
                            </div>
                            <h1 className={`block md:hidden text-lg md:text-xl font-medium text-gray-900 my-auto mr-8`}>
                              {formatStakedAmount(userEscrowsFetchResult?.data?.totalClaimablePop)} POP
                            </h1>
                          </div>
                          <div className="flex flex-row my-auto">
                            <h1 className={`hidden md:block text-3xl font-medium text-gray-900 my-auto mr-8`}>
                              {formatStakedAmount(userEscrowsFetchResult?.data?.totalClaimablePop)} POP
                            </h1>
                            <button
                              onClick={() => claimAllEscrows()}
                              className="mx-auto my-auto bg-blue-600 border border-transparent rounded-full justify-self-center shadow-custom py-3 px-5 md:px-10"
                            >
                              <p className="font-semibold text-base md:text-lg text-white">Claim All</p>
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
  );
}