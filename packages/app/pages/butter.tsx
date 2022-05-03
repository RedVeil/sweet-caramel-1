import { parseEther } from "@ethersproject/units";
import {
  adjustDepositDecimals,
  bigNumberToNumber,
  formatAndRoundBigNumber,
  getMinMintAmount,
  isButterSupportedOnCurrentNetwork,
  localStringOptions,
  ModalType,
  prepareHotSwap,
  toggleModal,
} from "@popcorn/utils";
import { BatchProcessTokenKey, BatchProcessTokens, BatchType, SelectedToken } from "@popcorn/utils/src/types";
import BatchProgress from "components/BatchButter/BatchProgress";
import ClaimableBatches from "components/BatchButter/ClaimableBatches";
import MintRedeemInterface from "components/BatchButter/MintRedeemInterface";
import StatInfoCard from "components/BatchButter/StatInfoCard";
import Tutorial from "components/BatchButter/Tutorial";
import StatusWithLabel from "components/Common/StatusWithLabel";
import MainActionButton from "components/MainActionButton";
import Navbar from "components/NavBar/NavBar";
import { setDualActionWideModal, setMobileFullScreenModal, setMultiChoiceActionModal } from "context/actions";
import { store } from "context/store";
import { ChainId } from "context/Web3/connectors";
import { BigNumber, constants, ethers } from "ethers";
import useButter from "hooks/butter/useButter";
import useButterBatch from "hooks/butter/useButterBatch";
import useButterBatchData from "hooks/butter/useButterBatchData";
import useButterBatchZapper from "hooks/butter/useButterBatchZapper";
import useGetButterAPY from "hooks/butter/useGetButterAPY";
import useStakingPool from "hooks/staking/useStakingPool";
import useThreeCurveVirtualPrice from "hooks/useThreeCurveVirtualPrice";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import toast, { Toaster } from "react-hot-toast";
import abi from "../public/ButterBatchZapperAbi.json";

enum TOKEN_INDEX {
  dai,
  usdc,
  usdt,
}

function isDepositDisabled(depositAmount: BigNumber, inputTokenBalance: BigNumber): boolean {
  return depositAmount.gt(inputTokenBalance);
}

function getZapDepositAmount(depositAmount: BigNumber, tokenKey: string): [BigNumber, BigNumber, BigNumber] {
  switch (tokenKey) {
    case "dai":
      return [depositAmount, BigNumber.from("0"), BigNumber.from("0")];
    case "usdc":
      return [BigNumber.from("0"), depositAmount, BigNumber.from("0")];
    case "usdt":
      return [BigNumber.from("0"), BigNumber.from("0"), depositAmount];
  }
}

export interface ButterPageState {
  selectedToken: SelectedToken;
  useZap: boolean;
  depositAmount: BigNumber;
  redeeming: boolean;
  useUnclaimedDeposits: boolean;
  slippage: number;
  initalLoad: boolean;
  token: BatchProcessTokens;
}

const DEFAULT_STATE: ButterPageState = {
  selectedToken: null,
  useZap: false,
  depositAmount: BigNumber.from("0"),
  redeeming: false,
  useUnclaimedDeposits: false,
  slippage: 1,
  initalLoad: true,
  token: null,
};

export default function Butter(): JSX.Element {
  const {
    signerOrProvider,
    account,
    chainId,
    onContractSuccess,
    onContractError,
    contractAddresses,
    connect,
    setChain,
    signer,
  } = useWeb3();
  const { dispatch } = useContext(store);
  const router = useRouter();
  const butter = useButter();
  const butterBatchZapper = useButterBatchZapper();
  const butterBatch = useButterBatch();
  const { data: butterAPY } = useGetButterAPY();
  const {
    data: butterBatchData,
    error: errorFetchingButterBatchData,
    mutate: refetchButterBatchData,
  } = useButterBatchData();
  const { data: butterStaking } = useStakingPool(contractAddresses.butterStaking);
  const [butterPageState, setButterPageState] = useState<ButterPageState>(DEFAULT_STATE);
  const virtualPrice = useThreeCurveVirtualPrice(contractAddresses?.butterDependency?.threePool);
  const loadingButterBatchData = !butterBatchData && !errorFetchingButterBatchData;

  useEffect(() => {
    if (!signerOrProvider || !chainId) {
      return;
    }
    if (!isButterSupportedOnCurrentNetwork(chainId)) {
      dispatch(
        setDualActionWideModal({
          title: "Coming Soon",
          content: "Currently, Butter is only available on Ethereum.",
          onConfirm: {
            label: "Switch Network",
            onClick: () => {
              setChain(ChainId.Ethereum);
              dispatch(setDualActionWideModal(false));
            },
          },
          onDismiss: {
            label: "Go Back",
            onClick: () => {
              router.push("/");
              dispatch(setDualActionWideModal(false));
            },
          },
          keepOpen: true,
        }),
      );
    } else {
      dispatch(setDualActionWideModal(false));
    }
  }, [signerOrProvider, account, chainId]);

  useEffect(() => {
    if (!butterBatchData || !butterBatchData?.batchProcessTokens) {
      return;
    }
    if (butterPageState.initalLoad) {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: butterBatchData?.batchProcessTokens?.threeCrv?.key,
          output: butterBatchData?.batchProcessTokens?.butter?.key,
        },
        token: butterBatchData?.batchProcessTokens,
        redeeming: false,
        initalLoad: false,
      });
    } else {
      setButterPageState({
        ...butterPageState,
        token: butterBatchData?.batchProcessTokens,
      });
    }
  }, [butterBatchData]);

  useEffect(() => {
    if (!butterBatchData || !butterBatchData?.batchProcessTokens) {
      return;
    }
    if (butterPageState.redeeming) {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: butterPageState?.token?.butter?.key,
          output: butterPageState?.token?.threeCrv?.key,
        },
        useZap: false,
        depositAmount: BigNumber.from("0"),
        useUnclaimedDeposits: false,
      });
    } else {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: butterPageState?.token?.threeCrv?.key,
          output: butterPageState?.token?.butter?.key,
        },
        useZap: false,
        depositAmount: BigNumber.from("0"),
        useUnclaimedDeposits: false,
      });
    }
  }, [butterPageState.redeeming]);

  const hasClaimableBalances = () => {
    if (butterPageState.redeeming) {
      return butterBatchData?.claimableMintBatches.length > 0;
    }
    return butterBatchData?.claimableRedeemBatches.length > 0;
  };

  function selectToken(token: BatchProcessTokenKey): void {
    const zapToken = ["dai", "usdc", "usdt"];
    const newSelectedToken = { ...butterPageState.selectedToken };
    if (butterPageState.redeeming) {
      newSelectedToken.output = token;
    } else {
      newSelectedToken.input = token;
    }
    if (zapToken.includes(newSelectedToken.output) || zapToken.includes(newSelectedToken.input)) {
      setButterPageState({
        ...butterPageState,
        selectedToken: newSelectedToken,
        useUnclaimedDeposits: false,
        useZap: true,
        depositAmount: BigNumber.from("0"),
      });
    } else {
      setButterPageState({
        ...butterPageState,
        selectedToken: newSelectedToken,
        useUnclaimedDeposits: false,
        useZap: false,
        depositAmount: BigNumber.from("0"),
      });
    }
  }

  async function hotswap(depositAmount: BigNumber, batchType: BatchType): Promise<void> {
    if (batchType === BatchType.Mint) {
      batchType = BatchType.Redeem;
    } else {
      batchType = BatchType.Mint;
    }
    const batches =
      batchType === BatchType.Redeem ? butterBatchData?.claimableRedeemBatches : butterBatchData?.claimableMintBatches;
    const hotSwapParameter = prepareHotSwap(batches, depositAmount);
    toast.loading("Depositing Funds...");
    await butterBatch
      .moveUnclaimedDepositsIntoCurrentBatch(hotSwapParameter.batchIds as string[], hotSwapParameter.amounts, batchType)
      .then((res) =>
        onContractSuccess(res, `Funds deposited!`, () => {
          refetchButterBatchData();
          setButterPageState({ ...butterPageState, depositAmount: constants.Zero });
        }),
      )
      .catch((err) => onContractError(err));
  }

  async function deposit(depositAmount: BigNumber, batchType: BatchType): Promise<void> {
    depositAmount = adjustDepositDecimals(depositAmount, butterPageState.selectedToken.input);
    if (batchType === BatchType.Mint) {
      toast.loading(`Depositing ${butterPageState.token[butterPageState.selectedToken.input].name} ...`);
      let mintCall;
      if (butterPageState.useZap) {
        const virtualPriceValue = await virtualPrice();
        const minMintAmount = getMinMintAmount(
          depositAmount,
          butterPageState.selectedToken.input,
          butterPageState.slippage,
          virtualPriceValue,
        );
        mintCall = butterBatchZapper.zapIntoBatch(
          getZapDepositAmount(depositAmount, butterPageState.selectedToken.input),
          minMintAmount,
        );
      } else {
        mintCall = butterBatch.depositForMint(depositAmount, account);
      }

      await mintCall
        .then((res) =>
          onContractSuccess(
            res,
            `${butterPageState.token[butterPageState.selectedToken.input].name} deposited!`,
            () => {
              refetchButterBatchData();
              setButterPageState({ ...butterPageState, depositAmount: constants.Zero });
              toggleModal(
                ModalType.MultiChoice,
                {
                  title: "Deposit for Mint",
                  content:
                    "You have successfully deposited into the current mint batch. Check the table at the bottom of this page to claim the tokens when they are ready.",
                  image: <img src="images/butter/modal-1.png" className="px-6" />,
                  onConfirm: {
                    label: "Close",
                    onClick: () => dispatch(setMultiChoiceActionModal(false)),
                  },
                  onDismiss: {
                    label: "Do not remind me again",
                    onClick: () => {
                      localStorage.setItem("hideBatchProcessingPopover", "true");
                      dispatch(setMultiChoiceActionModal(false));
                    },
                  },
                },
                "hideMintPopover",
                dispatch,
              );
            },
          ),
        )
        .catch((err) => onContractError(err));
    } else {
      toast.loading("Depositing Butter...");
      await butterBatch
        .depositForRedeem(depositAmount)
        .then((res) =>
          onContractSuccess(res, "Butter deposited!", () => {
            refetchButterBatchData();
            setButterPageState({ ...butterPageState, depositAmount: constants.Zero });
            toggleModal(
              ModalType.MultiChoice,
              {
                title: "Deposit for Redeem",
                content:
                  "You have successfully deposited into the current redeem batch. Check the table at the bottom of this page to claim the tokens when they are ready.",
                image: <img src="images/butter/batch-popover.png" className="px-6" />,
                onConfirm: {
                  label: "Close",
                  onClick: () => dispatch(setMultiChoiceActionModal(false)),
                },
                onDismiss: {
                  label: "Do not remind me again",
                  onClick: () => {
                    localStorage.setItem("hideBatchProcessingPopover", "true");
                    dispatch(setMultiChoiceActionModal(false));
                  },
                },
              },
              "hideRedeemPopover",
              dispatch,
            );
          }),
        )
        .catch((err) => onContractError(err));
    }
  }

  async function claim(batchId: string, useZap?: boolean, outputToken?: string): Promise<void> {
    toast.loading("Claiming Batch...");
    let call;
    if (useZap) {
      call = butterBatchZapper.claimAndSwapToStable(
        batchId,
        TOKEN_INDEX[outputToken],
        adjustDepositDecimals(
          butterBatchData?.accountBatches
            .find((batch) => batch.batchId === batchId)
            .accountClaimableTokenBalance.mul(butterBatchData?.batchProcessTokens?.threeCrv.price)
            .div(butterBatchData?.batchProcessTokens[outputToken].price),
          outputToken,
        )
          .mul(100 - butterPageState.slippage)
          .div(100),
      );
    } else {
      call = butterBatch.claim(batchId, account);
    }
    await call
      .then((res) =>
        onContractSuccess(res, `Batch claimed!`, () => {
          refetchButterBatchData();
          toggleModal(
            ModalType.MultiChoice,
            {
              title: "You claimed your Token",
              children: (
                <p className="text-sm text-gray-500">
                  Your tokens should now be visible in your wallet. If you can’t see your BTR, import it here:
                  <a
                    onClick={async () =>
                      window.ethereum.request({
                        method: "wallet_watchAsset",
                        params: {
                          type: "ERC20",
                          options: {
                            address: butter.address,
                            symbol: "BTR",
                            decimals: 18,
                          },
                        },
                      })
                    }
                    className="text-blue-600 cursor-pointer"
                  >
                    BTR
                  </a>
                </p>
              ),
              image: <img src="/images/butter/modal-2.png" className="px-6" />,
              onConfirm: {
                label: "Close",
                onClick: () => dispatch(setMultiChoiceActionModal(false)),
              },
              onDismiss: {
                label: "Do not remind me again",
                onClick: () => {
                  localStorage.setItem("hideClaimSuccessPopover", "true");
                  dispatch(setMultiChoiceActionModal(false));
                },
              },
            },
            "hideClaimSuccessPopover",
            dispatch,
          );
        }),
      )
      .catch((err) => onContractError(err));
  }

  async function claimAndStake(batchId: string): Promise<void> {
    toast.loading("Claiming and staking Butter...");
    await butterBatch
      .claimAndStake(batchId, account)
      .then((res) => onContractSuccess(res, `Staked claimed Butter`, () => refetchButterBatchData()))
      .catch((err) => onContractError(err));
  }

  async function withdraw(batchId: string, amount: BigNumber, useZap?: boolean, outputToken?: string): Promise<void> {
    let call;
    if (useZap) {
      call = new ethers.Contract(contractAddresses.butterBatchZapper, abi, signer).zapOutOfBatch(
        batchId,
        amount,
        TOKEN_INDEX[outputToken],
        adjustDepositDecimals(amount, outputToken)
          .mul(100 - butterPageState.slippage)
          .div(100),
      );
    } else {
      call = butterBatch.withdrawFromBatch(batchId, amount, account);
    }
    await call
      .then((res) =>
        onContractSuccess(res, "Funds withdrawn!", () => {
          refetchButterBatchData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  async function approve(contractKey: string): Promise<void> {
    toast.loading("Approving Token...");
    const selectedTokenContract = butterBatchData?.batchProcessTokens[contractKey].contract;
    await selectedTokenContract
      .approve(butterPageState.useZap ? butterBatchZapper.address : butterBatch.address, ethers.constants.MaxUint256)
      .then((res) =>
        onContractSuccess(res, "Token approved!", () => {
          refetchButterBatchData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  function getBatchProgressAmount(): BigNumber {
    if (!butterBatchData) {
      return BigNumber.from("0");
    }
    return butterPageState.redeeming
      ? butterBatchData?.currentBatches.redeem.suppliedTokenBalance
          .mul(butterBatchData?.batchProcessTokens?.butter.price)
          .div(parseEther("1"))
      : butterBatchData?.currentBatches.mint.suppliedTokenBalance
          .mul(butterBatchData?.batchProcessTokens?.threeCrv.price)
          .div(parseEther("1"));
  }

  return (
    <div className="w-full h-full">
      <Navbar />
      <Toaster position="top-right" />
      <div className="mx-auto md:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mt-14 pb-32">
        <div className="md:w-6/12 mx-4 md:mx-0 text-center md:text-left">
          <h1 className="text-3xl font-bold">Butter - Yield Optimizer</h1>
          <p className="mt-2 text-lg text-gray-500">
            Mint BTR and earn interest on multiple stablecoins at once.
            <br />
            Stake your BTR to earn boosted APY.
          </p>
          <div className="flex flex-row flex-wrap items-center mt-4 justify-center md:justify-start">
            <div className="pr-6 border-r-2 border-gray-200 mt-2">
              <div className="hidden md:block ">
                <StatusWithLabel
                  content={
                    butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
                      ? (butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(
                          undefined,
                          localStringOptions,
                        ) + "%"
                      : "New 🍿✨"
                  }
                  label="Est. APY"
                  green
                  infoIconProps={{
                    id: "estApy",
                    title: "How we calculate the APY",
                    content: `The shown APY comes from yield on the underlying stablecoins (${
                      butterAPY ? butterAPY.toLocaleString(undefined, localStringOptions) : "-"
                    }%) and is boosted with POP (${
                      butterStaking ? formatAndRoundBigNumber(butterStaking.apy, 2) : "-"
                    }%). You must stake your BTR to receive the additional APY in POP.`,
                  }}
                />
              </div>
              <div className="md:hidden">
                <StatusWithLabel
                  content={
                    butterBatchData?.batchProcessTokens?.butter && butterBatchData?.butterSupply
                      ? `$${formatAndRoundBigNumber(
                          butterBatchData?.butterSupply
                            .mul(butterBatchData?.batchProcessTokens?.butter.price)
                            .div(parseEther("1")),
                        )}`
                      : "$-"
                  }
                  label="Total Deposits"
                />
              </div>
            </div>
            <div className="pl-6 md:px-6 md:border-r-2 border-gray-200 mt-2">
              <div className="hidden md:block ">
                <StatusWithLabel
                  content={
                    butterBatchData?.batchProcessTokens?.butter && butterBatchData?.butterSupply
                      ? `$${formatAndRoundBigNumber(
                          butterBatchData?.butterSupply
                            .mul(butterBatchData?.batchProcessTokens?.butter.price)
                            .div(parseEther("1")),
                        )}`
                      : "$-"
                  }
                  label="Total Deposits"
                />
              </div>
              <div className="md:hidden">
                <StatusWithLabel content={`Coming Soon`} label="Social Impact" />
              </div>
            </div>
            <div className="mt-2 md:pl-6 text-center md:text-left">
              <div className="hidden md:block ">
                <StatusWithLabel content={`Coming Soon`} label="Social Impact" />
              </div>
              <div className="md:hidden">
                <StatusWithLabel
                  content={
                    butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
                      ? (butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(
                          undefined,
                          localStringOptions,
                        ) + "%"
                      : "New 🍿✨"
                  }
                  label="Est. APY"
                  green
                  infoIconProps={{
                    id: "estApy",
                    title: "How we calculate the APY",
                    content: `The shown APY comes from yield on the underlying stablecoins (${
                      butterAPY ? butterAPY.toLocaleString(undefined, localStringOptions) : "-"
                    } %) and is boosted with POP (${
                      butterStaking ? formatAndRoundBigNumber(butterStaking.apy, 2) : "-"
                    } %). You must stake your BTR to receive the additional APY in POP.`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row mt-10 mx-4 md:mx-0">
          <div className="order-2 md:order-1 md:w-1/3">
            {butterBatchData && butterPageState.selectedToken ? (
              <MintRedeemInterface
                token={butterBatchData?.batchProcessTokens}
                selectToken={selectToken}
                deposit={butterPageState.useUnclaimedDeposits ? hotswap : deposit}
                approve={approve}
                depositDisabled={
                  butterPageState.useUnclaimedDeposits
                    ? isDepositDisabled(
                        butterPageState.depositAmount,
                        butterPageState.token[butterPageState.selectedToken.input].claimableBalance,
                      )
                    : isDepositDisabled(
                        butterPageState.depositAmount,
                        butterPageState.token[butterPageState.selectedToken.input].balance,
                      )
                }
                hasUnclaimedBalances={hasClaimableBalances()}
                butterPageState={[butterPageState, setButterPageState]}
              />
            ) : (
              <>
                {!account && (
                  <div className="h-full px-5 pt-6 md:mr-8 bg-white border border-gray-200 rounded-3xl pb-14 laptop:pb-18 shadow-custom">
                    <div className="w-full py-64 mt-1 mb-2 smlaptop:mt-2">
                      <MainActionButton
                        label="Connect Wallet"
                        handleClick={() => {
                          connect();
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            {account && !butterBatchData && loadingButterBatchData && (
              <>
                <div className="hidden md:block">
                  <ContentLoader viewBox="0 0 450 600">
                    <rect x="0" y="0" rx="20" ry="20" width="400" height="600" />
                  </ContentLoader>
                </div>
                <div className="md:hidden">
                  <ContentLoader viewBox="0 0 500 600">
                    <rect x="0" y="0" rx="20" ry="20" width="500" height="600" />
                  </ContentLoader>
                </div>
              </>
            )}
          </div>

          <div className="order-1 md:order-2 md:w-2/3 flex flex-col">
            <div className="flex flex-col md:flex-row">
              <div className="block md:hidden md:w-1/2 md:mr-2 mb-4 md:mb-0">
                <div
                  className="flex flex-col justify-center h-full rounded-3xl border border-gray-200 shadow-custom w-full px-2 pt-2 pb-2 bg-primaryLight"
                  onClick={() => {
                    dispatch(
                      setMobileFullScreenModal({
                        title: "",
                        children: <Tutorial />,
                        onDismiss: () => dispatch(setMobileFullScreenModal(false)),
                      }),
                    );
                  }}
                >
                  <div className="flex flex-row items-center justify-end mt-0.5">
                    <div className="w-full flex flex-row justify-center">
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Learn how it works</h3>
                      </div>
                    </div>
                    <div className="flex flex-row">
                      <div className="mr-2">
                        <img title="play-icon" src="/images/icons/IconPlay.svg" />
                      </div>
                    </div>
                    <div></div>
                  </div>
                </div>
              </div>
              <div className="block md:hidden md:w-1/2 md:mr-2 mb-10 md:mb-0">
                <div
                  className="flex flex-col justify-center h-full rounded-3xl border border-gray-200 shadow-custom w-full px-2 pt-2 pb-2 bg-green-100"
                  onClick={() => {
                    dispatch(
                      setMobileFullScreenModal({
                        title: "",
                        children: (
                          <div className="flex flex-col px-8 text-left">
                            <div className="">
                              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Mint
                              </h3>
                              <div className="my-4">
                                <p className="text-lg text-gray-500">
                                  Mint BTR with 3CRV or stablecoins to earn interest on multiple Stablecoins at once. As
                                  the value of the underlying assets increase, so does the redeemable value of Butter.
                                  This process converts deposited funds into other stablecoins and deploys them in Yearn
                                  to generate interest.
                                </p>
                              </div>
                            </div>
                            <div className="mt-14">
                              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Redeem
                              </h3>
                              <div className="my-4">
                                <p className="text-lg text-gray-500">
                                  Redeem your BTR to receive its value in 3CRV or stablecoins. We will convert all the
                                  underlying tokens of BTR back into 3CRV or your desired stablecoin.
                                </p>
                              </div>
                            </div>
                          </div>
                        ),
                        onDismiss: () => dispatch(setMobileFullScreenModal(false)),
                      }),
                    );
                  }}
                >
                  <div className="flex flex-row items-center justify-end mt-0.5">
                    <div className="w-full flex flex-row justify-center">
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">What is Mint & Redeem?</h3>
                      </div>
                    </div>
                    <div className="flex flex-row">
                      <div className="mr-2">
                        <img title="play-icon" src="/images/icons/IconPlay.svg" />
                      </div>
                    </div>
                    <div></div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 md:mr-2 mb-4 md:mb-0">
                <StatInfoCard
                  title="Butter Value"
                  content={`$ ${
                    butterBatchData?.batchProcessTokens?.butter
                      ? formatAndRoundBigNumber(butterBatchData?.batchProcessTokens?.butter?.price)
                      : "-"
                  }`}
                  icon={{ icon: "Money", color: "bg-blue-300" }}
                />
              </div>
              <div className="md:w-1/2 md:ml-2 mb-8 md:mb-0">
                <BatchProgress batchAmount={getBatchProgressAmount()} threshold={parseEther("100000")} />
              </div>
            </div>

            <div className="hidden md:flex w-full h-128 flex-row items-center pt-8 pb-6 pl-2 pr-2 mt-8 border border-gray-200 h-min-content smlaptop:pt-16 laptop:pt-12 lglaptop:pt-16 2xl:pt-12 smlaptop:pb-10 lglaptop:pb-12 2xl:pb-10 rounded-4xl shadow-custom bg-primaryLight">
              <Tutorial />
            </div>
          </div>
        </div>
        {butterBatchData?.accountBatches?.length > 0 && (
          <div className="w-full pb-12 mx-auto mt-10">
            <div className="mx-4 md:mx-0 p-2 overflow-hidden border border-gray-200 shadow-custom rounded-3xl">
              <ClaimableBatches
                batches={butterBatchData?.accountBatches}
                claim={claim}
                claimAndStake={claimAndStake}
                withdraw={withdraw}
                butterPageState={[butterPageState, setButterPageState]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
