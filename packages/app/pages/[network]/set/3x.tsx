import { parseEther } from "@ethersproject/units";
import { ThreeXWhaleProcessing } from "@popcorn/hardhat/typechain";
import {
  adjustDepositDecimals,
  ChainId,
  formatAndRoundBigNumber,
  getMinMintAmount,
  isButterSupportedOnCurrentNetwork,
  prepareHotSwap,
} from "@popcorn/utils";
import { BatchMetadata, BatchProcessTokenKey, BatchType } from "@popcorn/utils/src/types";
import BatchProgress from "components/BatchButter/BatchProgress";
import ClaimableBatches from "components/BatchButter/ClaimableBatches";
import MintRedeemInterface from "components/BatchButter/MintRedeemInterface";
import StatInfoCard from "components/BatchButter/StatInfoCard";
import Tutorial from "components/BatchButter/Tutorial";
import ButterStats from "components/ButterStats";
import MainActionButton from "components/MainActionButton";
import { setDualActionWideModal, setMobileFullScreenModal, setMultiChoiceActionModal } from "context/actions";
import { store } from "context/store";
import { BigNumber, constants, ethers } from "ethers";
import { ModalType, toggleModal } from "helper/modalHelpers";
import useSetToken from "hooks/butter/useSetToken";
import useThreeXBatch from "hooks/butter/useThreeXBatch";
import useThreeXData from "hooks/butter/useThreeXData";
import useThreeXWhale from "hooks/butter/useThreeXWhale";
import useThreeXWhaleData from "hooks/butter/useThreeXWhaleData";
import useThreeXZapper from "hooks/butter/useThreeXZapper";
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";
import { ButterPageState, DEFAULT_BUTTER_PAGE_STATE } from "./butter";

export enum TOKEN_INDEX {
  dai,
  usdc,
  usdt,
}

const ZAP_TOKEN = ["dai", "usdt"];

export default function ThreeX(): JSX.Element {
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
  } = useWeb3();
  const { dispatch } = useContext(store);
  const threeX = useSetToken(contractAddresses.threeX);
  const threeXZapper = useThreeXZapper();
  const threeXBatch = useThreeXBatch();
  const threeXWhale = useThreeXWhale();
  const { data: threeXData, error: errorFetchingThreeXData, mutate: refetchThreeXBatchData } = useThreeXData();
  const {
    data: threeXWhaleData,
    error: errorFetchingThreeXWhaleData,
    mutate: refetchThreeXWhaleData,
  } = useThreeXWhaleData();
  const [threeXPageState, setThreeXPageState] = useState<ButterPageState>(DEFAULT_BUTTER_PAGE_STATE);
  const loadingThreeXData = !threeXData && !errorFetchingThreeXData;

  const refetchThreeXData = () => Promise.all([refetchThreeXBatchData(), refetchThreeXWhaleData()]);

  useEffect(() => {
    if (!signerOrProvider || !chainId) {
      return;
    }
    if (!isButterSupportedOnCurrentNetwork(chainId)) {
      dispatch(
        setDualActionWideModal({
          title: "Coming Soon",
          content: "Currently, 3X is only available on Ethereum.",
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
    if (!threeXData || !threeXData?.tokens) {
      return;
    }
    setThreeXPageState((state) =>
      state.initalLoad
        ? {
          ...state,
          selectedToken: {
            input: threeXData?.tokens?.usdc?.key,
            output: threeXData?.tokens?.threeX?.key,
          },
          tokens: threeXData?.tokens,
          redeeming: false,
          initalLoad: false,
          isThreeX: true,
        }
        : {
          ...state,
          tokens: state.instant ? threeXWhaleData?.tokens : threeXData?.tokens,
        },
    );
  }, [threeXData, threeXWhaleData]);

  useEffect(() => {
    setThreeXPageState((state) => ({
      ...state,
      selectedToken: {
        input: state?.selectedToken?.input,
        output: state.redeeming ? state?.tokens?.usdc?.key : state?.tokens?.threeX?.key,
      },
      tokens: state.instant ? threeXWhaleData?.tokens : threeXData?.tokens,
    }));
  }, [threeXPageState.instant]);

  useEffect(() => {
    if (!threeXData || !threeXData?.tokens) {
      return;
    }
    setThreeXPageState((state) => ({
      ...state,
      selectedToken: {
        input: state.redeeming ? state?.tokens?.threeX?.key : state?.tokens?.usdc?.key,
        output: state.redeeming ? state?.tokens?.usdc?.key : state?.tokens?.threeX?.key,
      },
      useZap: false,
      depositAmount: constants.Zero,
      useUnclaimedDeposits: false,
    }));
  }, [threeXPageState.redeeming]);

  const hasClaimableBalances = () => {
    if (threeXPageState.redeeming) {
      return threeXData?.claimableMintBatches.length > 0;
    }
    return threeXData?.claimableRedeemBatches.length > 0;
  };

  function selectToken(token: BatchProcessTokenKey): void {
    setThreeXPageState((state) => ({
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

  async function handleMainAction(depositAmount: BigNumber, batchType: BatchType, stakeImmidiate = false) {
    // Lower depositAmount decimals to 1e6 if the inputToken is USDC/USDT
    depositAmount = adjustDepositDecimals(depositAmount, threeXPageState.selectedToken.input);

    if (threeXPageState.instant && threeXPageState.redeeming) {
      await instantRedeem(threeXWhale, depositAmount, threeXPageState, threeXData).then(
        (res) => onContractSuccess(res, "3x redeemed!"),
        (err) => onContractError(err),
      );
    } else if (threeXPageState.instant) {
      await instantMint(threeXWhale, depositAmount, threeXPageState, threeXData, stakeImmidiate).then(
        (res) => onContractSuccess(res, "3x minted!"),
        (err) => onContractError(err),
      );
    } else if (threeXPageState.useUnclaimedDeposits && batchType === BatchType.Mint) {
      await hotswapMint(depositAmount).then(
        (res) => onContractSuccess(res, `Funds deposited!`),
        (err) => onContractError(err),
      );
    } else if (threeXPageState.useUnclaimedDeposits) {
      await hotswapRedeem(depositAmount).then(
        (res) => onContractSuccess(res, `Funds deposited!`),
        (err) => onContractError(err),
      );
    } else if (batchType === BatchType.Mint) {
      await batchMint(depositAmount).then(handleMintSuccess, (err) => onContractError(err));
    } else {
      await batchRedeem(depositAmount).then(handleRedeemSuccess, (err) => onContractError(err));
    }
    await refetchThreeXData();
    setThreeXPageState((state) => ({ ...state, depositAmount: constants.Zero }));
  }

  async function hotswapRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    const batches = threeXData?.claimableMintBatches;
    const hotSwapParameter = prepareHotSwap(batches, depositAmount);
    toast.loading("Depositing Funds...");
    return threeXBatch.moveUnclaimedIntoCurrentBatch(hotSwapParameter.batchIds, hotSwapParameter.amounts, false);
  }
  async function hotswapMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    const batches = threeXData?.claimableRedeemBatches;
    const hotSwapParameter = prepareHotSwap(batches, depositAmount);
    toast.loading("Depositing Funds...");
    return threeXBatch.moveUnclaimedIntoCurrentBatch(hotSwapParameter.batchIds, hotSwapParameter.amounts, true);
  }

  async function batchMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading(`Depositing ${threeXPageState.tokens[threeXPageState.selectedToken.input].name} ...`);
    if (threeXPageState.useZap) {
      const minMintAmount = getMinMintAmount(
        depositAmount,
        threeXPageState.slippage,
        parseEther("1"),
        threeXPageState.selectedToken.input === "dai" ? 18 : 6,
        6,
      );
      return threeXZapper.zapIntoBatch(
        depositAmount,
        TOKEN_INDEX[threeXPageState.selectedToken.input],
        TOKEN_INDEX.usdc,
        minMintAmount,
      );
    }
    return threeXBatch.depositForMint(depositAmount, account);
  }
  async function batchRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading("Depositing 3X...");
    return threeXBatch.depositForRedeem(depositAmount);
  }
  function handleMintSuccess(res) {
    onContractSuccess(res, `${threeXPageState.tokens[threeXPageState.selectedToken.input].name} deposited!`, () => {
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
    onContractSuccess(res, "3X deposited!", () => {
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
      call = threeXZapper.claimAndSwapToStable(
        batchId,
        TOKEN_INDEX.usdc,
        TOKEN_INDEX[outputToken],
        adjustDepositDecimals(
          threeXData?.accountBatches
            .find((batch) => batch.batchId === batchId)
            .accountClaimableTokenBalance.mul(threeXData?.tokens?.usdc.price)
            .div(threeXData?.tokens[outputToken].price),
          outputToken,
        )
          .mul(100 - threeXPageState.slippage)
          .div(100),
      );
    } else {
      call = threeXBatch.claim(batchId, account);
    }
    await call
      .then((res) =>
        onContractSuccess(res, `Batch claimed!`, () => {
          refetchThreeXData();
          toggleModal(
            ModalType.MultiChoice,
            {
              title: "You claimed your token",
              children: (
                <p className="text-sm text-gray-500">
                  Your tokens should now be visible in your wallet. To see your tokens, &nbsp;
                  <a
                    onClick={async () =>
                      window.ethereum.request({
                        method: "wallet_watchAsset",
                        params: {
                          type: "ERC20",
                          options: {
                            address: threeX.address,
                            symbol: "3X",
                            decimals: 18,
                          },
                        },
                      })
                    }
                    className="text-blue-600 cursor-pointer"
                  >
                    Add 3X to Wallet
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
    toast.loading("Claiming and staking 3X...");
    await threeXBatch
      .claimAndStake(batchId)
      .then((res) => onContractSuccess(res, `Staked claimed 3X`, () => refetchThreeXData()))
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
          refetchThreeXData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  async function withdraw(batchId: string, amount: BigNumber, useZap?: boolean, outputToken?: BatchProcessTokenKey) {
    if (useZap) {
      return threeXZapper.zapOutOfBatch(
        batchId,
        amount,
        TOKEN_INDEX.usdc,
        TOKEN_INDEX[outputToken],
        adjustDepositDecimals(amount, outputToken)
          .mul(100 - threeXPageState.slippage)
          .div(100),
      );
    } else {
      return threeXBatch["withdrawFromBatch(bytes32,uint256,address)"](batchId, amount, account);
    }
  }

  function getCurrentlyActiveContract() {
    if (threeXPageState.instant) {
      return threeXWhale;
    } else if (threeXPageState.useZap) {
      return threeXZapper;
    } else {
      return threeXBatch;
    }
  }

  async function approve(contractKey: string): Promise<void> {
    toast.loading("Approving Token...");
    const selectedTokenContract = threeXPageState?.tokens[contractKey].contract;
    await selectedTokenContract
      .approve(getCurrentlyActiveContract().address, ethers.constants.MaxUint256)
      .then((res) =>
        onContractSuccess(res, "Token approved!", () => {
          refetchThreeXData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  function getBatchProgressAmount(): BigNumber {
    if (!threeXData) {
      return BigNumber.from("0");
    }
    return threeXPageState.redeeming
      ? threeXData?.currentBatches.redeem.suppliedTokenBalance
        .mul(threeXData?.tokens?.threeX.price)
        .div(parseEther("1"))
      : threeXData?.currentBatches.mint.suppliedTokenBalance
        .mul(threeXData?.tokens?.usdc.price)
        .div(BigNumber.from(1_000_000));
  }

  function isBalanceInsufficient(depositAmount: BigNumber, inputTokenBalance: BigNumber): boolean {
    return depositAmount.gt(inputTokenBalance);
  }

  const isDepositDisabled = (): boolean => {
    const tvl = threeXData?.totalSupply?.mul(threeXData?.tokens?.threeX?.price).div(parseEther("1"));
    const tvlLimit = parseEther("1000000"); // 1m
    if (!threeXPageState.redeeming && (tvl.gte(tvlLimit) || threeXPageState?.depositAmount.add(tvl).gte(tvlLimit))) {
      return true;
    }
    return threeXPageState.useUnclaimedDeposits
      ? isBalanceInsufficient(
        threeXPageState.depositAmount,
        threeXPageState.tokens[threeXPageState.selectedToken.input].claimableBalance,
      )
      : isBalanceInsufficient(
        threeXPageState.depositAmount,
        threeXPageState.tokens[threeXPageState.selectedToken.input].balance,
      );
  };

  return (
    <>
      <div className="md:max-w-2xl mx-4 md:mx-0 text-center md:text-left">
        <h1 className="text-3xl font-bold">3X - Yield Optimizer</h1>
        <p className="mt-2 text-lg text-gray-500">
          Mint 3X and earn interest on multiple stablecoins at once.
          <br />
          Stake your 3X to earn boosted APY.
        </p>
        <ButterStats butterData={threeXData} addresses={[contractAddresses.ySusd, contractAddresses.y3Eur]} isThreeX />
      </div>
      <div className="flex flex-col md:flex-row mt-10 mx-4 md:mx-0">
        <div className="order-2 md:order-1 md:w-1/3 mb-10">
          {account ? (
            loadingThreeXData ? (
              <>
                <div>
                  <ContentLoader viewBox="0 0 450 600">
                    <rect x="0" y="0" rx="20" ry="20" width="400" height="600" />
                  </ContentLoader>
                </div>
              </>
            ) : (
              <div className="md:pr-8">
                {threeXData && threeXPageState.tokens && threeXPageState.selectedToken && (
                  <MintRedeemInterface
                    token={threeXPageState?.tokens}
                    selectToken={selectToken}
                    mainAction={handleMainAction}
                    approve={approve}
                    depositDisabled={isDepositDisabled()}
                    hasUnclaimedBalances={hasClaimableBalances()}
                    butterPageState={[threeXPageState, setThreeXPageState]}
                    isThreeXPage
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
                      children: <Tutorial isThreeX />,
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
                                Mint 3X with USDC or other stablecoins to earn interest on a basket of dollar and euro
                                denominated stablecoins at once. As the value of the underlying assets increase, so does
                                the redeemable value of 3X. This process converts deposited funds into other stablecoins
                                and deploys them in Yearn to generate interest.
                              </p>
                            </div>
                          </div>
                          <div className="mt-14">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                              Redeem
                            </h3>
                            <div className="my-4">
                              <p className="text-lg text-gray-500">
                                Redeem your 3X to receive its value in USDC or other stablecoins. We will convert all
                                the underlying tokens of 3X back into USDC or your desired stablecoin.
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
                title="3X Value"
                content={`$${threeXData?.tokens?.threeX ? formatAndRoundBigNumber(threeXData?.tokens?.threeX?.price) : "-"
                  }`}
                icon={{ name: "3X", color: "bg-gray-100" }}
                info={{
                  title: "Underlying Tokens",
                  content: (
                    <span>
                      <br />
                      50% yvCurve-sUSDpool <br />
                      50% yvCurve-3EURpool <br />
                      <br />
                      3X Has Exposure to: sUSD, DAI, USDC, USDT, agEUR, EURT and EURS.
                    </span>
                  ),
                }}
              />
            </div>
            <div className="md:w-1/2 md:ml-2 mb-8 md:mb-0">
              <BatchProgress batchAmount={getBatchProgressAmount()} threshold={parseEther("100000")} />
            </div>
          </div>

          <div className="hidden md:flex w-full h-128 flex-row items-center pt-8 pb-6 pl-2 pr-2 mt-8 border border-gray-200 h-min-content smlaptop:pt-16 laptop:pt-12 lglaptop:pt-16 2xl:pt-12 smlaptop:pb-10 lglaptop:pb-12 2xl:pb-10 rounded-4xl shadow-custom bg-primaryLight">
            <Tutorial isThreeX />
          </div>
        </div>
      </div>
      {threeXData?.accountBatches?.length > 0 && (
        <div className="w-full pb-12 mx-auto mt-10">
          <div className="mx-4 md:mx-0 p-2 overflow-hidden border border-gray-200 shadow-custom rounded-3xl">
            <ClaimableBatches
              batches={threeXData?.accountBatches}
              claim={claim}
              claimAndStake={claimAndStake}
              withdraw={handleWithdraw}
              butterPageState={[threeXPageState, setThreeXPageState]}
              isThreeX
            />
          </div>
        </div>
      )}
    </>
  );
}
export async function instantMint(
  threeXWhale: ThreeXWhaleProcessing,
  depositAmount: BigNumber,
  threeXPageState: ButterPageState,
  threeXData: BatchMetadata,
  stakeImmidiate: boolean,
): Promise<ethers.ContractTransaction> {
  toast.loading("Minting 3X...");
  return threeXWhale["mint(uint256,int128,int128,uint256,bool)"](
    depositAmount,
    TOKEN_INDEX[threeXPageState.selectedToken.input],
    TOKEN_INDEX.usdc,
    getMinMintAmount(
      depositAmount,
      threeXPageState.slippage,
      threeXData.tokens.threeX.price,
      threeXPageState.selectedToken.input === "dai" ? 18 : 6,
      18,
    ),
    stakeImmidiate,
  );
}

export async function instantRedeem(
  threeXWhale: ThreeXWhaleProcessing,
  depositAmount: BigNumber,
  threeXPageState: ButterPageState,
  threeXData: BatchMetadata,
): Promise<ethers.ContractTransaction> {
  toast.loading("Depositing 3X...");
  return threeXWhale["redeem(uint256,int128,int128,uint256)"](
    depositAmount,
    TOKEN_INDEX.usdc,
    TOKEN_INDEX[threeXPageState.selectedToken.output],
    0,
  );
}
