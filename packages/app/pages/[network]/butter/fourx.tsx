import { parseEther } from "@ethersproject/units";
import {
  adjustDepositDecimals,
  formatAndRoundBigNumber,
  getMinMintAmount,
  isButterSupportedOnCurrentNetwork,
  prepareHotSwap,
} from "@popcorn/utils";
import { BatchProcessTokenKey, BatchType } from "@popcorn/utils/src/types";
import BatchProgress from "components/BatchButter/BatchProgress";
import ClaimableBatches from "components/BatchButter/ClaimableBatches";
import MintRedeemInterface from "components/BatchButter/MintRedeemInterface";
import StatInfoCard from "components/BatchButter/StatInfoCard";
import Tutorial from "components/BatchButter/Tutorial";
import ButterStats from "components/ButterStats";
import MainActionButton from "components/MainActionButton";
import { setDualActionWideModal, setMobileFullScreenModal, setMultiChoiceActionModal } from "context/actions";
import { store } from "context/store";
import { ChainId } from "context/Web3/connectors";
import { BigNumber, constants, ethers } from "ethers";
import { ModalType, toggleModal } from "helper/modalHelpers";
import useFourXBatch from "hooks/butter/useFourXBatch";
import useFourXData from "hooks/butter/useFourXData";
import useFourXZapper from "hooks/butter/useFourXZapper";
import useSetToken from "hooks/butter/useSetToken";
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";
import { ButterPageState, DEFAULT_BUTTER_PAGE_STATE } from ".";

export enum TOKEN_INDEX {
  dai,
  usdc,
  usdt,
}

export function isDepositDisabled(depositAmount: BigNumber, inputTokenBalance: BigNumber): boolean {
  return depositAmount.gt(inputTokenBalance);
}

const ZAP_TOKEN = ["dai", "usdt"];

export default function FourX(): JSX.Element {
  const {
    signerOrProvider,
    account,
    chainId,
    onContractSuccess,
    onContractError,
    contractAddresses,
    connect,
    setChain,
    pushWithinChain,
    signer,
  } = useWeb3();
  const { dispatch } = useContext(store);
  const fourX = useSetToken(contractAddresses.fourX);
  const fourXZapper = useFourXZapper();
  const fourXBatch = useFourXBatch();
  const { data: fourXData, error: errorFetchingFourXData, mutate: refetchFourXData } = useFourXData();
  const [fourXPageState, setFourXPageState] = useState<ButterPageState>(DEFAULT_BUTTER_PAGE_STATE);
  const loadingFourXData = !fourXData && !errorFetchingFourXData;

  useEffect(() => {
    if (!signerOrProvider || !chainId) {
      return;
    }
    if (!isButterSupportedOnCurrentNetwork(chainId)) {
      dispatch(
        setDualActionWideModal({
          title: "Coming Soon",
          content: "Currently, 4X is only available on Ethereum.",
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
              pushWithinChain("/");
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
    if (!fourXData || !fourXData?.tokens) {
      return;
    }
    if (fourXPageState.initalLoad) {
      setFourXPageState({
        ...fourXPageState,
        selectedToken: {
          input: fourXData?.tokens?.usdc?.key,
          output: fourXData?.tokens?.fourX?.key,
        },
        tokens: fourXData?.tokens,
        redeeming: false,
        initalLoad: false,
      });
    } else {
      setFourXPageState((state) => ({
        ...state,
        tokens: fourXData?.tokens,
      }));
    }
  }, [fourXData]);

  useEffect(() => {
    if (!fourXData || !fourXData?.tokens) {
      return;
    }
    setFourXPageState((state) => ({
      ...state,
      selectedToken: {
        input: state.redeeming ? state?.tokens?.fourX?.key : state?.tokens?.usdc?.key,
        output: state.redeeming ? state?.tokens?.usdc?.key : state?.tokens?.fourX?.key,
      },
      useZap: false,
      depositAmount: BigNumber.from("0"),
      useUnclaimedDeposits: false,
    }));
  }, [fourXPageState.redeeming]);

  const hasClaimableBalances = () => {
    if (fourXPageState.redeeming) {
      return fourXData?.claimableMintBatches.length > 0;
    }
    return fourXData?.claimableRedeemBatches.length > 0;
  };

  function selectToken(token: BatchProcessTokenKey): void {
    setFourXPageState((state) => ({
      ...state,
      selectedToken: {
        input: state.redeeming ? state.selectedToken.input : token,
        output: state.redeeming ? token : state.selectedToken.output,
      },
      useUnclaimedDeposits: false,
      useZap: ZAP_TOKEN.includes(token),
      depositAmount: BigNumber.from("0"),
    }));
  }

  async function handleMainAction(depositAmount: BigNumber, batchType: BatchType) {
    depositAmount = adjustDepositDecimals(depositAmount, fourXPageState.selectedToken.input);
    if (fourXPageState.useUnclaimedDeposits && batchType === BatchType.Mint) {
      await hotswapMint(depositAmount).then(
        (res) => onContractSuccess(res, `Funds deposited!`),
        (err) => onContractError(err),
      );
    } else if (fourXPageState.useUnclaimedDeposits) {
      await hotswapRedeem(depositAmount).then(
        (res) => onContractSuccess(res, `Funds deposited!`),
        (err) => onContractError(err),
      );
    } else if (batchType === BatchType.Mint) {
      await batchMint(depositAmount).then(handleMintSuccess, (err) => onContractError(err));
    } else {
      await batchRedeem(depositAmount).then(handleRedeemSuccess, (err) => onContractError(err));
    }
    await refetchFourXData();
    setFourXPageState((state) => ({ ...state, depositAmount: constants.Zero }));
  }

  async function hotswapRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    const batches = fourXData?.claimableMintBatches;
    const hotSwapParameter = prepareHotSwap(batches, depositAmount);
    toast.loading("Depositing Funds...");
    return fourXBatch.moveUnclaimedIntoCurrentBatch(hotSwapParameter.batchIds, hotSwapParameter.amounts, false);
  }
  async function hotswapMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    const batches = fourXData?.claimableRedeemBatches;
    const hotSwapParameter = prepareHotSwap(batches, depositAmount);
    toast.loading("Depositing Funds...");
    return fourXBatch.moveUnclaimedIntoCurrentBatch(hotSwapParameter.batchIds, hotSwapParameter.amounts, true);
  }
  async function batchMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading(`Depositing ${fourXPageState.tokens[fourXPageState.selectedToken.input].name} ...`);
    if (fourXPageState.useZap) {
      const minMintAmount = getMinMintAmount(
        depositAmount,
        fourXPageState.selectedToken.input,
        fourXPageState.slippage,
        parseEther("1"),
      );
      return fourXZapper.zapIntoBatch(
        depositAmount,
        TOKEN_INDEX[fourXPageState.selectedToken.input],
        TOKEN_INDEX.usdc,
        minMintAmount,
      );
    }
    return fourXBatch.depositForMint(depositAmount, account);
  }
  async function batchRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading("Depositing FourX...");
    return fourXBatch.depositForRedeem(depositAmount);
  }
  function handleMintSuccess(res) {
    onContractSuccess(res, `${fourXPageState.tokens[fourXPageState.selectedToken.input].name} deposited!`, () => {
      toggleModal(
        ModalType.MultiChoice,
        {
          title: "Deposit for Mint",
          content:
            "You have successfully deposited into the current mint batch. Check the table at the bottom of this page to claim the tokens when they are ready.",
          image: <img src="/images/butter/modal-1.png" className="px-6" />,
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
    });
  }
  function handleRedeemSuccess(res) {
    onContractSuccess(res, "4X deposited!", () => {
      toggleModal(
        ModalType.MultiChoice,
        {
          title: "Deposit for Redeem",
          content:
            "You have successfully deposited into the current redeem batch. Check the table at the bottom of this page to claim the tokens when they are ready.",
          image: <img src="/images/butter/batch-popover.png" className="px-6" />,
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
    });
  }

  async function claim(batchId: string, useZap?: boolean, outputToken?: BatchProcessTokenKey): Promise<void> {
    toast.loading("Claiming Batch...");
    let call;
    if (useZap) {
      call = fourXZapper.claimAndSwapToStable(
        batchId,
        TOKEN_INDEX.usdc,
        TOKEN_INDEX[outputToken],
        adjustDepositDecimals(
          fourXData?.accountBatches
            .find((batch) => batch.batchId === batchId)
            .accountClaimableTokenBalance.mul(fourXData?.tokens?.usdc.price)
            .div(fourXData?.tokens[outputToken].price),
          outputToken,
        )
          .mul(100 - fourXPageState.slippage)
          .div(100),
      );
    } else {
      call = fourXBatch.claim(batchId, account);
    }
    await call
      .then((res) =>
        onContractSuccess(res, `Batch claimed!`, () => {
          refetchFourXData();
          toggleModal(
            ModalType.MultiChoice,
            {
              title: "You claimed your Token",
              children: (
                <p className="text-sm text-gray-500">
                  Your tokens should now be visible in your wallet. If you can’t see your 4X, import it here:
                  <a
                    onClick={async () =>
                      window.ethereum.request({
                        method: "wallet_watchAsset",
                        params: {
                          type: "ERC20",
                          options: {
                            address: fourX.address,
                            symbol: "4X",
                            decimals: 18,
                          },
                        },
                      })
                    }
                    className="text-blue-600 cursor-pointer"
                  >
                    4X
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
    toast.loading("Claiming and staking 4X...");
    await fourXBatch
      .claimAndStake(batchId)
      .then((res) => onContractSuccess(res, `Staked claimed 4X`, () => refetchFourXData()))
      .catch((err) => onContractError(err));
  }

  async function handleWithdraw(
    batchId: string,
    amount: BigNumber,
    useZap?: boolean,
    outputToken?: BatchProcessTokenKey,
  ) {
    withdraw(batchId, amount, useZap, outputToken)
      .then((res) =>
        onContractSuccess(res, "Funds withdrawn!", () => {
          refetchFourXData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  async function withdraw(batchId: string, amount: BigNumber, useZap?: boolean, outputToken?: BatchProcessTokenKey) {
    if (useZap) {
      return fourXZapper.zapOutOfBatch(
        batchId,
        amount,
        TOKEN_INDEX.usdc,
        TOKEN_INDEX[outputToken],
        adjustDepositDecimals(amount, outputToken)
          .mul(100 - fourXPageState.slippage)
          .div(100),
      );
    } else {
      return fourXBatch["withdrawFromBatch(bytes32,uint256,address)"](batchId, amount, account);
    }
  }

  async function approve(contractKey: string): Promise<void> {
    toast.loading("Approving Token...");
    const selectedTokenContract = fourXData?.tokens[contractKey].contract;
    await selectedTokenContract
      .approve(fourXPageState.useZap ? fourXZapper.address : fourXBatch.address, ethers.constants.MaxUint256)
      .then((res) =>
        onContractSuccess(res, "Token approved!", () => {
          refetchFourXData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  function getBatchProgressAmount(): BigNumber {
    if (!fourXData) {
      return BigNumber.from("0");
    }
    return fourXPageState.redeeming
      ? fourXData?.currentBatches.redeem.suppliedTokenBalance.mul(fourXData?.tokens?.fourX.price).div(parseEther("1"))
      : fourXData?.currentBatches.mint.suppliedTokenBalance
          .mul(fourXData?.tokens?.usdc.price)
          .div(BigNumber.from(1_000_000));
  }

  return (
    <div>
      <div className="md:max-w-2xl mx-4 md:mx-0 text-center md:text-left">
        <h1 className="text-3xl font-bold">4X - Yield Optimizer</h1>
        <p className="mt-2 text-lg text-gray-500">
          Mint 4X and earn interest on multiple stablecoins at once.
          <br />
          Stake your 4X to earn boosted APY.
        </p>
        <ButterStats butterData={fourXData} addresses={[contractAddresses.yD3, contractAddresses.y3Eur]} isFourX />
      </div>
      <div className="flex flex-col md:flex-row mt-10 mx-4 md:mx-0">
        <div className="order-2 md:order-1 md:w-1/3 mb-10">
          {account ? (
            loadingFourXData ? (
              <>
                <div>
                  <ContentLoader viewBox="0 0 450 600">
                    <rect x="0" y="0" rx="20" ry="20" width="400" height="600" />
                  </ContentLoader>
                </div>
              </>
            ) : (
              <div className="md:pr-8">
                {fourXData && fourXPageState.tokens && fourXPageState.selectedToken && (
                  <MintRedeemInterface
                    token={fourXData?.tokens}
                    selectToken={selectToken}
                    mainAction={handleMainAction}
                    approve={approve}
                    depositDisabled={
                      fourXPageState.useUnclaimedDeposits
                        ? isDepositDisabled(
                            fourXPageState.depositAmount,
                            fourXPageState.tokens[fourXPageState.selectedToken.input].claimableBalance,
                          )
                        : isDepositDisabled(
                            fourXPageState.depositAmount,
                            fourXPageState.tokens[fourXPageState.selectedToken.input].balance,
                          )
                    }
                    hasUnclaimedBalances={hasClaimableBalances()}
                    butterPageState={[fourXPageState, setFourXPageState]}
                    isFourXPage
                  />
                )}
              </div>
            )
          ) : (
            <div className="px-5 pt-6 md:mr-8 bg-white border border-gray-200 rounded-3xl pb-14 laptop:pb-18 shadow-custom">
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
                                Mint 4X with Dai or other stablecoins to earn interest on EUR,GBP,CHF and JPY at once.
                                As the value of the underlying assets increase, so does the redeemable value of 4X. This
                                process converts deposited funds into other stablecoins and deploys them in Yearn to
                                generate interest.
                              </p>
                            </div>
                          </div>
                          <div className="mt-14">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                              Redeem
                            </h3>
                            <div className="my-4">
                              <p className="text-lg text-gray-500">
                                Redeem your 4X to receive its value in sUSD or other stablecoins. We will convert all
                                the underlying tokens of 4X back into sUSD or your desired stablecoin.
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
                title="4X Value"
                content={`$ ${
                  fourXData?.tokens?.fourX ? formatAndRoundBigNumber(fourXData?.tokens?.fourX?.price) : "-"
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
      {fourXData?.accountBatches?.length > 0 && (
        <div className="w-full pb-12 mx-auto mt-10">
          <div className="mx-4 md:mx-0 p-2 overflow-hidden border border-gray-200 shadow-custom rounded-3xl">
            <ClaimableBatches
              batches={fourXData?.accountBatches}
              claim={claim}
              claimAndStake={claimAndStake}
              withdraw={handleWithdraw}
              butterPageState={[fourXPageState, setFourXPageState]}
              isFourX
            />
          </div>
        </div>
      )}
    </div>
  );
}
