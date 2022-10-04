import { parseEther } from "@ethersproject/units";
import { Dialog, Transition } from "@headlessui/react";
import { ThreeXWhaleProcessing } from "@popcorn/hardhat/typechain";
import {
  adjustDepositDecimals,
  ChainId,
  formatAndRoundBigNumber,
  getIndexForToken,
  getMinZapAmount,
  isButterSupportedOnCurrentNetwork,
  prepareHotSwap,
} from "@popcorn/utils";
import { BatchType, Token } from "@popcorn/utils/src/types";
import BatchProgress from "components/BatchButter/BatchProgress";
import { Pages } from "components/BatchButter/ButterTokenInput";
import ClaimableBatches from "components/BatchButter/ClaimableBatches";
import MintRedeemInterface from "components/BatchButter/MintRedeemInterface";
import MobileTutorialSlider from "components/BatchButter/MobileTutorialSlider";
import StatInfoCard from "components/BatchButter/StatInfoCard";
import TutorialSlider from "components/BatchButter/TutorialSlider";
import ButterStats from "components/ButterStats";
import SecondaryActionButton from "components/SecondaryActionButton";
import RightArrowIcon from "components/SVGIcons/RightArrowIcon";
import { setDualActionWideModal, setMultiChoiceActionModal } from "context/actions";
import { store } from "context/store";
import { BigNumber, constants, ethers } from "ethers";
import { ModalType, toggleModal } from "helper/modalHelpers";
import useSetToken from "hooks/set/useSetToken";
import useThreeXBatch from "hooks/set/useThreeXBatch";
import useThreeXData from "hooks/set/useThreeXData";
import useThreeXWhale from "hooks/set/useThreeXWhale";
import useThreeXWhaleData from "hooks/set/useThreeXWhaleData";
import useThreeXZapper from "hooks/set/useThreeXZapper";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";
import { isDepositDisabled } from "../../../helper/isDepositDisabled";
import { ButterPageState, DEFAULT_BUTTER_PAGE_STATE } from "./butter";

export default function ThreeX(): JSX.Element {
  const {
    signerOrProvider,
    account,
    signer,
    chainId,
    onContractSuccess,
    onContractError,
    contractAddresses,
    connect,
    setChain,
    pushWithinChain,
  } = useWeb3();
  const router = useRouter();
  const { dispatch } = useContext(store);
  const threeXSetToken = useSetToken(contractAddresses.threeX);
  const threeXZapper = useThreeXZapper();
  const threeXBatch = useThreeXBatch();
  const threeXWhale = useThreeXWhale();
  const ZAP_TOKEN = [contractAddresses.dai, contractAddresses.usdt];
  const { data: threeXData, error: errorFetchingThreeXData, mutate: refetchThreeXBatchData } = useThreeXData();
  const {
    data: threeXWhaleData,
    error: errorFetchingThreeXWhaleData,
    mutate: refetchThreeXWhaleData,
  } = useThreeXWhaleData();
  const [threeXPageState, setThreeXPageState] = useState<ButterPageState>(DEFAULT_BUTTER_PAGE_STATE);
  const loadingThreeXData = !threeXData && !errorFetchingThreeXData;
  const [showMobileTutorial, toggleMobileTutorial] = useState<boolean>(false);

  const refetchThreeXData = () => Promise.all([refetchThreeXBatchData(), refetchThreeXWhaleData()]);

  const threeX = useMemo(
    () =>
      (threeXPageState.instant ? threeXWhaleData : threeXData)?.tokens?.find(
        (token) => token.address === contractAddresses.threeX,
      ),
    [threeXPageState, threeXWhaleData, threeXData],
  );

  const usdc = useMemo(
    () =>
      (threeXPageState.instant ? threeXWhaleData : threeXData)?.tokens?.find(
        (token) => token.address === contractAddresses.usdc,
      ),
    [threeXPageState, threeXWhaleData, threeXData],
  );

  useEffect(() => {
    if (!signerOrProvider || !chainId) {
      return;
    }
    if (!isButterSupportedOnCurrentNetwork(chainId)) {
      dispatch(
        setDualActionWideModal({
          title: "Coming Soon",
          content: "Currently, 3X is only available on Ethereum.",
          image: <img src="/images/modalImages/comingSoon.svg" />,
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
              router.back();
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
            input: usdc,
            output: threeX,
          },
          tokens: threeXData?.tokens,
          redeeming: false,
          initalLoad: false,
          isThreeX: true,
        }
        : {
          ...state,
          selectedToken: {
            input: (state.instant ? threeXWhaleData?.tokens : threeXData?.tokens).find(
              (token) => token.address === state.selectedToken.input.address,
            ),
            output: (state.instant ? threeXWhaleData?.tokens : threeXData?.tokens).find(
              (token) => token.address === state.selectedToken.output.address,
            ),
          },
          tokens: state.instant ? threeXWhaleData?.tokens : threeXData?.tokens,
        },
    );
  }, [threeXData, threeXWhaleData]);

  useEffect(() => {
    function selectOutputToken(state: ButterPageState): Token {
      if (state.instant) {
        return threeXWhaleData?.tokens?.find((token) => token.address === state.selectedToken.output.address)
      } else {
        if (state.redeeming) {
          return usdc
        } else {
          return threeX
        }
      }
    }

    setThreeXPageState((state) => ({
      ...state,
      selectedToken: {
        input: (state.instant ? threeXWhaleData?.tokens : threeXData?.tokens)?.find(
          (token) => token.address === state.selectedToken.input.address,
        ),
        output: selectOutputToken(state)
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
        input: state.redeeming ? threeX : usdc,
        output: state.redeeming ? usdc : threeX,
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

  function selectToken(token: Token): void {
    setThreeXPageState((state) => ({
      ...state,
      selectedToken: {
        input: state.redeeming ? state.selectedToken.input : token,
        output: state.redeeming ? token : state.selectedToken.output,
      },
      useUnclaimedDeposits: false,
      useZap: ZAP_TOKEN.includes(token.address),
      depositAmount: BigNumber.from("0"),
    }));
  }

  async function handleMainAction(depositAmount: BigNumber, batchType: BatchType, stakeImmidiate = false) {
    // Lower depositAmount decimals to 1e6 if the inputToken is USDC/USDT
    depositAmount = await adjustDepositDecimals(depositAmount, threeXPageState.selectedToken.input);

    if (threeXPageState.instant && threeXPageState.redeeming) {
      await instantRedeem(threeXWhale, depositAmount, threeXPageState, signer).then(
        (res) => onContractSuccess(res, "3x redeemed!"),
        (err) => onContractError(err),
      );
    } else if (threeXPageState.instant) {
      await instantMint(threeXWhale, depositAmount, threeXPageState, threeX.price, stakeImmidiate, signer).then(
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
    return threeXBatch
      .connect(signer)
      .moveUnclaimedIntoCurrentBatch(hotSwapParameter.batchIds, hotSwapParameter.amounts, false);
  }
  async function hotswapMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    const batches = threeXData?.claimableRedeemBatches;
    const hotSwapParameter = prepareHotSwap(batches, depositAmount);
    toast.loading("Depositing Funds...");
    return threeXBatch
      .connect(signer)
      .moveUnclaimedIntoCurrentBatch(hotSwapParameter.batchIds, hotSwapParameter.amounts, true);
  }

  async function batchMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading(`Depositing ${threeXPageState.selectedToken.input.name} ...`);
    if (threeXPageState.useZap) {
      const minUsdcAmount = getMinZapAmount(
        depositAmount,
        threeXPageState.slippage,
        parseEther("1"),
        threeXPageState.selectedToken.input.address === contractAddresses.dai ? 18 : 6,
        6,
      );

      return threeXZapper
        .connect(signer)
        .zapIntoBatch(
          depositAmount,
          getIndexForToken(threeXPageState.selectedToken.input),
          getIndexForToken(usdc),
          minUsdcAmount,
        );
    }
    return threeXBatch.connect(signer).depositForMint(depositAmount, account);
  }
  async function batchRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading("Depositing 3X...");
    return threeXBatch.connect(signer).depositForRedeem(depositAmount);
  }
  function handleMintSuccess(res) {
    onContractSuccess(res, `${threeXPageState.selectedToken.input.name} deposited!`, () => {
      toggleModal(
        ModalType.MultiChoice,
        {
          title: "Deposit for Mint",
          content:
            "You have successfully deposited into the current mint batch. Check the table at the bottom of this page to claim the tokens when they are ready.",
          image: <img src="/images/modalImages/mint.svg" />,
          onConfirm: {
            label: "Continue",
            onClick: () => dispatch(setMultiChoiceActionModal(false)),
          },
          onDontShowAgain: {
            label: "Do not remind me again",
            onClick: () => {
              localStorage.setItem("hideBatchProcessingPopover", "true");
              dispatch(setMultiChoiceActionModal(false));
            },
          },
          onDismiss: {
            onClick: () => {
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
          image: <img src="/images/modalImages/mint.svg" />,
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

  async function claim(batchId: string, useZap?: boolean, outputToken?: Token): Promise<void> {
    toast.loading("Claiming Batch...");
    let call;
    if (useZap) {
      call = threeXZapper.connect(signer).claimAndSwapToStable(
        batchId,
        getIndexForToken(usdc),
        getIndexForToken(outputToken),
        (
          await adjustDepositDecimals(
            threeXData?.accountBatches
              .find((batch) => batch.batchId === batchId)
              .accountClaimableTokenBalance.mul(usdc.price)
              .div(outputToken.price),
            outputToken,
          )
        )
          .mul(100 - threeXPageState.slippage)
          .div(100),
      );
    } else {
      call = threeXBatch.connect(signer).claim(batchId, account);
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
                <>
                  <p className="text-base text-primaryDark mb-4">
                    Your tokens are now in your wallet. To see them make sure to import 3x into your wallet
                  </p>
                  <p>
                    <a
                      onClick={async () =>
                        window.ethereum.request({
                          method: "wallet_watchAsset",
                          params: {
                            type: "ERC20",
                            options: {
                              address: threeXSetToken.address,
                              symbol: "3X",
                              decimals: 18,
                            },
                          },
                        })
                      }
                      className="text-customPurple cursor-pointer"
                    >
                      Add 3X to Wallet
                    </a>
                  </p>
                </>
              ),
              image: <img src="/images/modalImages/redeemed.svg" />,
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
      .connect(signer)
      .claimAndStake(batchId)
      .then((res) => onContractSuccess(res, `Staked claimed 3X`, () => refetchThreeXData()))
      .catch((err) => onContractError(err));
  }

  async function handleWithdraw(batchId: string, amount: BigNumber, useZap?: boolean, outputToken?: Token) {
    withdraw(batchId, amount, useZap, outputToken)
      .then((res) =>
        onContractSuccess(res, "Funds withdrawn!", () => {
          refetchThreeXData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  async function withdraw(batchId: string, amount: BigNumber, useZap?: boolean, outputToken?: Token) {
    if (useZap) {
      return threeXZapper
        .connect(signer)
        .zapOutOfBatch(
          batchId,
          amount,
          getIndexForToken(usdc),
          getIndexForToken(outputToken),
          (await adjustDepositDecimals(amount, outputToken)).mul(100 - threeXPageState.slippage).div(100),
        );
    } else {
      return threeXBatch.connect(signer)["withdrawFromBatch(bytes32,uint256,address)"](batchId, amount, account);
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

  async function approve(token: Token): Promise<void> {
    toast.loading("Approving Token...");
    await token.contract
      .connect(signer)
      .approve(getCurrentlyActiveContract().address, ethers.constants.MaxUint256)
      .then((res) => onContractSuccess(res, "Token approved!", refetchThreeXData))
      .catch((err) => onContractError(err));
  }

  function getBatchProgressAmount(): BigNumber {
    if (!threeXData) {
      return BigNumber.from("0");
    }
    return threeXPageState.redeeming
      ? threeXData?.currentBatches.redeem.suppliedTokenBalance.mul(threeX?.price).div(parseEther("1"))
      : threeXData?.currentBatches.mint.suppliedTokenBalance.mul(usdc?.price).div(BigNumber.from(1_000_000));
  }

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 md:col-span-4">
          <h1 className="text-6xl leading-12">3X</h1>
          <p className="mt-4 leading-5 text-primaryDark">
            Mint 3X and earn interest on multiple stablecoins at once. Stake your 3X to earn boosted APY.
          </p>
          <ButterStats
            token={threeX}
            totalSupply={threeXData?.totalSupply}
            addresses={[contractAddresses.ySusd, contractAddresses.y3Eur]}
            isThreeX
          />
        </div>
        <div className="col-span-5 col-end-13 hidden md:block">
          <TutorialSlider isThreeX />
        </div>
      </div>
      <div className="md:hidden mt-10">
        <div
          className="bg-customPurple rounded-lg w-full px-6 py-6 text-white flex justify-between items-center"
          role="button"
          onClick={() => toggleMobileTutorial(true)}
        >
          <p className="text-medium">Learn How It Works</p>
          <RightArrowIcon color="fff" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row mt-10">
        <div className="md:w-1/3 mb-10">
          {account ? (
            loadingThreeXData ? (
              <>
                <div className="order-2 md:hidden">
                  <ContentLoader viewBox="0 0 450 600" backgroundColor={"#EBE7D4"} foregroundColor={"#d7d5bc"}>
                    <rect x="0" y="0" rx="8" ry="8" width="100%" height="600" />
                  </ContentLoader>
                </div>
                <div className="order-1 hidden md:block">
                  <ContentLoader viewBox="0 0 450 600" backgroundColor={"#EBE7D4"} foregroundColor={"#d7d5bc"}>
                    <rect x="0" y="0" rx="8" ry="8" width="90%" height="600" />
                  </ContentLoader>
                </div>
              </>
            ) : (
              <div className="md:pr-8 order-2 md:order-1">
                {threeXData && threeXPageState?.tokens && threeXPageState.selectedToken && (
                  <MintRedeemInterface
                    mainAction={handleMainAction}
                    approve={approve}
                    options={threeXPageState?.tokens}
                    selectedToken={threeXPageState.selectedToken}
                    selectToken={selectToken}
                    depositDisabled={isDepositDisabled(
                      threeXData.totalSupply,
                      threeX,
                      threeXPageState.selectedToken,
                      threeXPageState.redeeming,
                      threeXPageState.depositAmount,
                      threeXPageState.useUnclaimedDeposits,
                      true,
                    )}
                    page={Pages.threeX}
                    instant={threeXPageState.instant}
                    setInstant={(val) => setThreeXPageState((prevState) => ({ ...prevState, instant: val }))}
                    depositAmount={threeXPageState.depositAmount}
                    setDepositAmount={(val) =>
                      setThreeXPageState((prevState) => ({ ...prevState, depositAmount: val }))
                    }
                    showSlippageAdjust={
                      threeXPageState.instant || (threeXPageState.redeeming && threeXPageState.useZap)
                    }
                    slippage={threeXPageState.slippage}
                    setSlippage={(val) => setThreeXPageState((prevState) => ({ ...prevState, slippage: val }))}
                    withdrawMode={threeXPageState.redeeming}
                    setWithdrawMode={(val) => setThreeXPageState((prevState) => ({ ...prevState, redeeming: val }))}
                    hasUnclaimedBalances={hasClaimableBalances()}
                    useUnclaimedDeposits={threeXPageState.useUnclaimedDeposits}
                    setUseUnclaimedDeposits={(val) =>
                      setThreeXPageState((prevState) => ({ ...prevState, useUnclaimedDeposits: val }))
                    }
                  />
                )}
              </div>
            )
          ) : (
            <div
              className=" rounded-lg md:border md:border-customLightGray px-0 md:p-6 md:pb-0 md:mr-6"
              role="button"
              onClick={() => connect()}
            >
              <p className="text-gray-900 text-3xl leading-8 hidden md:block">Connect your wallet</p>
              <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-6 md:px-0 py-6 md:py-2 md:mt-4">
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

        <div className="order-1 md:order-2 md:w-2/3 flex flex-col">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 md:mr-2 mb-4 md:mb-0">
              <StatInfoCard
                title="3X Value"
                content={`${threeX ? formatAndRoundBigNumber(threeX?.price, threeX?.decimals) : "-"}`}
                icon={"3X"}
                info={{
                  title: "Underlying Tokens",
                  content: (
                    <span>
                      <br />
                      50% yvCurve-sUSDpool <br />
                      50% yvCurve-3EURpool <br />
                      <br />
                      3X has Exposure to: sUSD, DAI, USDC, USDT, agEUR, EURT and EURS.
                    </span>
                  ),
                }}
              />
            </div>
            <div className="md:w-1/2 md:ml-2 mb-8 md:mb-0">
              <BatchProgress batchAmount={getBatchProgressAmount()} threshold={parseEther("100000")} />
            </div>
          </div>
          <div className="w-full pb-12 mx-auto mt-10">
            <div className="md:overflow-x-hidden md:max-h-108">
              <ClaimableBatches
                options={[
                  usdc,
                  threeXPageState?.tokens?.find((token) => token.address === contractAddresses.dai),
                  threeXPageState?.tokens?.find((token) => token.address === contractAddresses.usdt),
                ]}
                slippage={threeXPageState.slippage}
                setSlippage={(val) => setThreeXPageState((prevState) => ({ ...prevState, slippage: val }))}
                batches={threeXData?.accountBatches}
                claim={claim}
                claimAndStake={claimAndStake}
                withdraw={handleWithdraw}
                isThreeX
              />
            </div>
          </div>
        </div>
      </div>
      {/* <FooterLandScapeImage/> */}

      <Transition.Root show={showMobileTutorial} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 overflow-hidden z-40" onClose={() => toggleMobileTutorial(false)}>
          <Dialog.Overlay className="absolute inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-700"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen">
                <MobileTutorialSlider isThreeX onCloseMenu={() => toggleMobileTutorial(false)} />
              </div>
            </Transition.Child>
          </Dialog.Overlay>
        </Dialog>
      </Transition.Root>
    </>
  );
}
export async function instantMint(
  threeXWhale: ThreeXWhaleProcessing,
  depositAmount: BigNumber,
  threeXPageState: ButterPageState,
  threeXPrice: BigNumber,
  stakeImmidiate: boolean,
  signer: string | ethers.providers.Provider | ethers.Signer,
): Promise<ethers.ContractTransaction> {
  toast.loading("Minting 3X...");
  return threeXWhale.connect(signer)["mint(uint256,int128,int128,uint256,bool)"](
    depositAmount,
    getIndexForToken(threeXPageState.selectedToken.input),
    1, // TokenIndex USDC
    getMinZapAmount(
      depositAmount,
      threeXPageState.slippage,
      threeXPrice,
      await threeXPageState.selectedToken.input.contract.decimals(),
      18,
    ),
    stakeImmidiate,
  );
}

export async function instantRedeem(
  threeXWhale: ThreeXWhaleProcessing,
  depositAmount: BigNumber,
  threeXPageState: ButterPageState,
  signer: string | ethers.providers.Provider | ethers.Signer,
): Promise<ethers.ContractTransaction> {
  toast.loading("Depositing 3X...");
  return threeXWhale.connect(signer)["redeem(uint256,int128,int128,uint256)"](
    depositAmount,
    1, // TokenIndex USDC
    getIndexForToken(threeXPageState.selectedToken.output),
    0,
  );
}
