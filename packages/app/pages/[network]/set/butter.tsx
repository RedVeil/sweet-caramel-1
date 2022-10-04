import { parseEther } from "@ethersproject/units";
import { Dialog, Transition } from "@headlessui/react";
import {
  adjustDepositDecimals,
  ChainId,
  formatAndRoundBigNumber,
  getIndexForToken,
  getMinZapAmount,
  isButterSupportedOnCurrentNetwork,
  percentageToBps,
  prepareHotSwap,
} from "@popcorn/utils";
import { BatchType, SelectedToken, Token } from "@popcorn/utils/src/types";
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
import { isDepositDisabled } from "helper/isDepositDisabled";
import { ModalType, toggleModal } from "helper/modalHelpers";
import useButterBatch from "hooks/set/useButterBatch";
import useButterBatchData from "hooks/set/useButterBatchData";
import useButterBatchZapper from "hooks/set/useButterBatchZapper";
import useButterWhaleData from "hooks/set/useButterWhaleData";
import useButterWhaleProcessing from "hooks/set/useButterWhaleProcessing";
import useThreeCurveVirtualPrice from "hooks/useThreeCurveVirtualPrice";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";

export enum TOKEN_INDEX {
  dai,
  usdc,
  usdt,
}

export function getZapDepositAmount(depositAmount: BigNumber, token: Token): [BigNumber, BigNumber, BigNumber] {
  switch (token.symbol) {
    case "DAI":
      console.log(token.symbol)
      return [depositAmount, constants.Zero, constants.Zero];
    case "USDC":
      return [constants.Zero, depositAmount, constants.Zero];
    case "USDT":
      return [constants.Zero, constants.Zero, depositAmount];
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
  tokens: Token[];
  instant: boolean;
  isThreeX: boolean;
}

export const DEFAULT_BUTTER_PAGE_STATE: ButterPageState = {
  selectedToken: null,
  useZap: false,
  depositAmount: constants.Zero,
  redeeming: false,
  useUnclaimedDeposits: false,
  slippage: 1, // in percent (1 = 100 BPS)
  initalLoad: true,
  tokens: null,
  instant: false,
  isThreeX: false,
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
  const butterBatchZapper = useButterBatchZapper();
  const butterBatch = useButterBatch();
  const butterWhaleProcessing = useButterWhaleProcessing();
  const { data: butterWhaleData, error: butterWhaleError, mutate: refetchButterWhaleData } = useButterWhaleData();
  const {
    data: butterBatchData,
    error: errorFetchingButterBatchData,
    mutate: refetchButterBatchData,
  } = useButterBatchData();
  const router = useRouter();
  const [butterPageState, setButterPageState] = useState<ButterPageState>(DEFAULT_BUTTER_PAGE_STATE);
  const virtualPrice = useThreeCurveVirtualPrice(contractAddresses?.butterDependency?.threePool);
  const loadingButterBatchData = !butterPageState.selectedToken?.input || !butterPageState.selectedToken?.output;
  const butterYearnAddresses = [
    contractAddresses.yFrax,
    contractAddresses.yRai,
    contractAddresses.yMusd,
    contractAddresses.yAlusd,
  ];
  const [showMobileTutorial, toggleMobileTutorial] = useState<boolean>(false);

  const threeCrv = useMemo(
    () =>
      (butterPageState.instant ? butterWhaleData : butterBatchData)?.tokens?.find(
        (token) => token.address === contractAddresses.threeCrv,
      ),
    [butterPageState, butterBatchData, butterWhaleData],
  );
  const butter = useMemo(
    () =>
      (butterPageState.instant ? butterWhaleData : butterBatchData)?.tokens?.find(
        (token) => token.address === contractAddresses.butter,
      ),
    [butterPageState, butterBatchData, butterWhaleData],
  );
  useEffect(() => {
    if (!signerOrProvider || !chainId) {
      return;
    }
    if (!isButterSupportedOnCurrentNetwork(chainId)) {
      dispatch(
        setDualActionWideModal({
          title: "Coming Soon",
          content: "Currently, Butter is only available on Ethereum.",
          image: <img src="/images/modalImages/mint.svg" className="px-6" />,
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
    if (!butterBatchData || !butterBatchData?.tokens || !butterWhaleData || !butterWhaleData?.tokens) {
      return;
    }
    if (butterPageState.initalLoad) {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: threeCrv,
          output: butter,
        },
        tokens: butterBatchData?.tokens,
        redeeming: false,
        initalLoad: false,
      });
    } else {
      setButterPageState((prevState) => ({
        ...prevState,
        selectedToken: {
          input: (prevState.instant ? butterWhaleData?.tokens : butterBatchData?.tokens).find(
            (token) => token.address === prevState.selectedToken.input.address,
          ),
          output: (prevState.instant ? butterWhaleData?.tokens : butterBatchData?.tokens).find(
            (token) => token.address === prevState.selectedToken.output.address,
          ),
        },
        tokens: prevState.instant ? butterWhaleData?.tokens : butterBatchData?.tokens,
      }));
    }
  }, [butterBatchData, butterWhaleData]);

  useEffect(() => {
    function selectOutputToken(state: ButterPageState): Token {
      if (state.instant) {
        return butterWhaleData?.tokens?.find((token) => token.address === state.selectedToken.output.address)
      } else {
        if (state.redeeming) {
          return threeCrv
        } else {
          return butter
        }
      }
    }

    setButterPageState((prevState) => ({
      ...prevState,
      selectedToken: {
        input: (prevState.instant ? butterWhaleData?.tokens : butterBatchData?.tokens)?.find(
          (token) => token.address === prevState.selectedToken.input.address,
        ),
        output: selectOutputToken(prevState)
      },
      tokens: prevState.instant ? butterWhaleData?.tokens : butterBatchData?.tokens,
    }));
  }, [butterPageState.instant]);


  useEffect(() => {
    if (!butterBatchData || !butterBatchData?.tokens) {
      return;
    }
    if (butterPageState.redeeming) {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: butter,
          output: threeCrv,
        },
        useZap: false,
        depositAmount: constants.Zero,
        useUnclaimedDeposits: false,
      });
    } else {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: threeCrv,
          output: butter,
        },
        useZap: false,
        depositAmount: constants.Zero,
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

  function selectToken(token: Token): void {
    console.log(token.symbol)
    const zapToken = [contractAddresses.dai, contractAddresses.usdc, contractAddresses.usdt];
    const newSelectedToken = { ...butterPageState.selectedToken };
    if (butterPageState.redeeming) {
      newSelectedToken.output = token;
    } else {
      newSelectedToken.input = token;
    }
    if (zapToken.includes(newSelectedToken.output.address) || zapToken.includes(newSelectedToken.input.address)) {
      setButterPageState({
        ...butterPageState,
        selectedToken: newSelectedToken,
        useUnclaimedDeposits: false,
        useZap: true,
        depositAmount: constants.Zero,
      });
    } else {
      setButterPageState({
        ...butterPageState,
        selectedToken: newSelectedToken,
        useUnclaimedDeposits: false,
        useZap: false,
        depositAmount: constants.Zero,
      });
    }
  }

  function handleMintSuccess(res) {
    onContractSuccess(res, `${butterPageState.selectedToken.input.symbol} deposited!`, () => {
      setButterPageState({ ...butterPageState, depositAmount: constants.Zero });
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
        "hideMintPopover",
        dispatch,
      );
    });
  }
  function handleRedeemSuccess(res) {
    onContractSuccess(res, "Butter deposited!", () => {
      setButterPageState({ ...butterPageState, depositAmount: constants.Zero });
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

  async function instantMint(depositAmount: BigNumber, stakeImmidiate = false): Promise<ethers.ContractTransaction> {
    toast.loading(`Depositing ${butterPageState.selectedToken.input.symbol}...`);
    if (butterPageState.useZap) {
      const virtualPriceValue = await virtualPrice();
      const min3CrvAmount = getMinZapAmount(
        depositAmount,
        butterPageState.slippage,
        virtualPriceValue,
        await butterPageState.selectedToken.input.contract.decimals(),
      );
      return butterWhaleProcessing.zapMint(
        getZapDepositAmount(depositAmount, butterPageState.selectedToken.input),
        min3CrvAmount,
        percentageToBps(butterPageState.slippage),
        stakeImmidiate,
      );
    }
    return butterWhaleProcessing.mint(depositAmount, percentageToBps(butterPageState.slippage), stakeImmidiate);
  }
  async function instantRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading(`Withdrawing ${butterPageState.selectedToken.output.symbol}...`);
    if (butterPageState.useZap) {
      return butterWhaleProcessing.zapRedeem(
        depositAmount,
        getIndexForToken(butterPageState.selectedToken.output),
        (await adjustDepositDecimals(depositAmount, butterPageState.selectedToken.output))
          .mul(100 - butterPageState.slippage)
          .div(100),
        butterPageState.slippage,
      );
    }
    return butterWhaleProcessing.redeem(depositAmount, percentageToBps(butterPageState.slippage));
  }
  async function batchMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading(`Depositing ${butterPageState.selectedToken.input.symbol} ...`);
    if (butterPageState.useZap) {
      const virtualPriceValue = await virtualPrice();
      console.log(depositAmount.toString())
      console.log(virtualPriceValue.toString())
      const minMintAmount = getMinZapAmount(
        depositAmount,
        butterPageState.slippage,
        virtualPriceValue,
        await butterPageState.selectedToken.input.contract.decimals(),
      );
      console.log(getZapDepositAmount(depositAmount, butterPageState.selectedToken.input).toString())
      return butterBatchZapper.zapIntoBatch(
        getZapDepositAmount(depositAmount, butterPageState.selectedToken.input),
        minMintAmount,
      );
    }
    return butterBatch.depositForMint(depositAmount, account);
  }
  async function batchRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading("Depositing Butter...");
    return butterBatch.depositForRedeem(depositAmount);
  }
  async function hotswapRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    const batches = butterBatchData?.claimableMintBatches;
    const hotSwapParameter = prepareHotSwap(batches, depositAmount);
    toast.loading("Depositing Funds...");
    return butterBatch.moveUnclaimedDepositsIntoCurrentBatch(
      hotSwapParameter.batchIds as string[],
      hotSwapParameter.amounts,
      BatchType.Mint,
    );
  }
  async function hotswapMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    const batches = butterBatchData?.claimableRedeemBatches;
    const hotSwapParameter = prepareHotSwap(batches, depositAmount);
    toast.loading("Depositing Funds...");
    return butterBatch.moveUnclaimedDepositsIntoCurrentBatch(
      hotSwapParameter.batchIds as string[],
      hotSwapParameter.amounts,
      BatchType.Redeem,
    );
  }

  async function handleMainAction(
    depositAmount: BigNumber,
    batchType: BatchType,
    stakeImmidiate = false,
  ): Promise<void> {
    depositAmount = await adjustDepositDecimals(depositAmount, butterPageState.selectedToken.input);
    if (butterPageState.instant && butterPageState.redeeming) {
      await instantRedeem(depositAmount).then(
        (res) =>
          onContractSuccess(res, "Butter redeemed!", () =>
            setButterPageState({ ...butterPageState, depositAmount: constants.Zero }),
          ),
        (err) => onContractError(err),
      );
    } else if (butterPageState.instant) {
      await instantMint(depositAmount, stakeImmidiate).then(
        (res) =>
          onContractSuccess(res, "Butter minted!", () =>
            setButterPageState({ ...butterPageState, depositAmount: constants.Zero }),
          ),
        (err) => onContractError(err),
      );
    } else if (butterPageState.useUnclaimedDeposits && batchType === BatchType.Mint) {
      hotswapMint(depositAmount).then(
        (res) =>
          onContractSuccess(res, `Funds deposited!`, () =>
            setButterPageState({ ...butterPageState, depositAmount: constants.Zero }),
          ),
        (err) => onContractError(err),
      );
    } else if (butterPageState.useUnclaimedDeposits) {
      await hotswapRedeem(depositAmount).then(
        (res) =>
          onContractSuccess(res, `Funds deposited!`, () =>
            setButterPageState({ ...butterPageState, depositAmount: constants.Zero }),
          ),
        (err) => onContractError(err),
      );
    } else if (batchType === BatchType.Mint) {
      await batchMint(depositAmount).then(handleMintSuccess, (err) => onContractError(err));
    } else {
      await batchRedeem(depositAmount).then(handleRedeemSuccess, (err) => onContractError(err));
    }
    await Promise.all([refetchButterBatchData(), refetchButterWhaleData()]);
  }

  function handleClaimSuccess(res) {
    onContractSuccess(res, `Batch claimed!`, () => {
      refetchButterBatchData();
      toggleModal(
        ModalType.MultiChoice,
        {
          title: "You claimed your token",
          children: (
            <>
              <p className="text-base text-primaryDark mb-4">
                Your tokens are now in your wallet. To see them make sure to import butter into your wallet
              </p>
              <p>
                <a
                  onClick={async () =>
                    window.ethereum.request({
                      method: "wallet_watchAsset",
                      params: {
                        type: "ERC20",
                        options: {
                          address: contractAddresses.butter,
                          symbol: "BTR",
                          decimals: 18,
                        },
                      },
                    })
                  }
                  className="text-customPurple cursor-pointer"
                >
                  Add BTR to Wallet
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
    });
  }
  async function claim(batchId: string, useZap?: boolean, outputToken?: Token): Promise<void> {
    toast.loading("Claiming Batch...");
    let call;
    if (useZap) {
      console.log(
        batchId,
        getIndexForToken(outputToken),
        (
          await adjustDepositDecimals(
            butterBatchData?.accountBatches
              .find((batch) => batch.batchId === batchId)
              .accountClaimableTokenBalance.mul(threeCrv.price)
              .div(outputToken.price),
            outputToken,
          )
        )
          .mul(100 - butterPageState.slippage)
          .div(100),
      );
      call = butterBatchZapper.claimAndSwapToStable(
        batchId,
        getIndexForToken(outputToken),
        (
          await adjustDepositDecimals(
            butterBatchData?.accountBatches
              .find((batch) => batch.batchId === batchId)
              .accountClaimableTokenBalance.mul(threeCrv.price)
              .div(outputToken.price),
            outputToken,
          )
        )
          .mul(100 - butterPageState.slippage)
          .div(100),
      );
    } else {
      call = butterBatch.claim(batchId, account);
    }
    await call.then(
      (res) => handleClaimSuccess(res),
      (err) => onContractError(err),
    );
  }

  async function claimAndStake(batchId: string): Promise<void> {
    toast.loading("Claiming and staking Butter...");
    await butterBatch
      .claimAndStake(batchId, account)
      .then((res) => onContractSuccess(res, `Staked claimed Butter`, () => refetchButterBatchData()))
      .catch((err) => onContractError(err));
  }

  async function withdraw(batchId: string, amount: BigNumber, useZap?: boolean, outputToken?: Token): Promise<void> {
    let call;
    if (useZap) {
      call = butterBatchZapper.zapOutOfBatch(
        batchId,
        amount,
        getIndexForToken(outputToken),
        (await adjustDepositDecimals(amount, outputToken)).mul(100 - butterPageState.slippage).div(100),
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

  function getCurrentContractAddress(): string {
    if (butterPageState.instant) {
      return butterWhaleProcessing.address;
    }
    if (butterPageState.useZap) {
      return butterBatchZapper.address;
    }
    return butterBatch.address;
  }

  async function approve(token: Token): Promise<void> {
    toast.loading("Approving Token...");
    await token.contract.approve(getCurrentContractAddress(), ethers.constants.MaxUint256).then(
      (res) =>
        onContractSuccess(res, "Token approved!", () => {
          refetchButterBatchData();
        }),
      (err) => onContractError(err),
    );
  }

  function getBatchProgressAmount(): BigNumber {
    if (!butterBatchData) {
      return constants.Zero;
    }
    return butterPageState.redeeming
      ? butterBatchData?.currentBatches.redeem.suppliedTokenBalance.mul(butter.price).div(parseEther("1"))
      : butterBatchData?.currentBatches.mint.suppliedTokenBalance.mul(threeCrv.price).div(parseEther("1"));
  }

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 md:col-span-5">
          <h1 className="text-6xl leading-12">Butter - Yield Optimizer</h1>
          <p className="mt-4 leading-5 text-primaryDark">
            Mint 3X and earn interest on multiple stablecoins at once. Stake your 3X to earn boosted APY.
          </p>
          <ButterStats token={butter} totalSupply={butterBatchData?.totalSupply} addresses={butterYearnAddresses} />
        </div>
        <div className="col-span-5 col-end-13 hidden md:block">
          <TutorialSlider isThreeX={false} />
        </div>
      </div>
      <div className="md:hidden mt-10">
        <div
          className="bg-customPurple rounded-lg w-full px-6 py-6 text-white flex justify-between items-center"
          role="button"
          onClick={() => toggleMobileTutorial(true)}
        >
          <p className="text-medium leading-4">Learn How It Works</p>
          <RightArrowIcon color="fff" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row mt-10">
        <div className="md:w-1/3 mb-10">
          {!account && (
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
          <div className="order-2 md:order-1">
            {account && loadingButterBatchData && (
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
            )}
            {account && !loadingButterBatchData && (
              <div className="md:pr-8">
                {butterBatchData && butterPageState.selectedToken && (
                  <MintRedeemInterface
                    approve={approve}
                    mainAction={handleMainAction}
                    options={butterPageState.tokens}
                    selectedToken={butterPageState.selectedToken}
                    selectToken={selectToken}
                    page={Pages.butter}
                    instant={butterPageState.instant}
                    setInstant={(val) => setButterPageState((prevState) => ({ ...prevState, instant: val }))}
                    depositAmount={butterPageState.depositAmount}
                    setDepositAmount={(val) =>
                      setButterPageState((prevState) => ({ ...prevState, depositAmount: val }))
                    }
                    depositDisabled={isDepositDisabled(
                      butterWhaleData.totalSupply,
                      butter,
                      butterPageState.selectedToken,
                      butterPageState.redeeming,
                      butterPageState.depositAmount,
                      butterPageState.useUnclaimedDeposits,
                    )}
                    withdrawMode={butterPageState.redeeming}
                    setWithdrawMode={(val) => {
                      setButterPageState((prevState) => ({ ...prevState, redeeming: val }));
                    }}
                    showSlippageAdjust={
                      butterPageState.instant || (butterPageState.redeeming && butterPageState.useZap)
                    }
                    slippage={butterPageState.slippage}
                    setSlippage={(val) => setButterPageState((prevState) => ({ ...prevState, slippage: val }))}
                    hasUnclaimedBalances={hasClaimableBalances()}
                    useUnclaimedDeposits={butterPageState.useUnclaimedDeposits}
                    setUseUnclaimedDeposits={(val) =>
                      setButterPageState((prevState) => ({ ...prevState, useUnclaimedDeposits: val }))
                    }
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="order-1 md:order-2 md:w-2/3 flex flex-col">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 md:mr-2 mb-4 md:mb-0">
              <StatInfoCard
                title="Butter Value"
                content={`$${butter ? formatAndRoundBigNumber(butter?.price, butter?.decimals) : "-"}`}
                icon={"Butter"}
                info={{
                  title: "Underlying Tokens",
                  content: (
                    <span>
                      <br />
                      25.00% yvCurve-FRAX <br />
                      25.00% yvCurve-RAI <br />
                      25.00% yvCurve-mUSD <br />
                      25.00% yvCurve-alUSD <br />
                      <br />
                      BTR has Exposure to: FRAX, RAI, mUSD, alUSD, sUSD and 3CRV (USDC/DAI/USDT).
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
                  threeCrv,
                  butterBatchData?.tokens?.find((token) => token.address === contractAddresses.dai),
                  butterBatchData?.tokens?.find((token) => token.address === contractAddresses.usdc),
                  butterBatchData?.tokens?.find((token) => token.address === contractAddresses.usdt),
                ]}
                slippage={butterPageState.slippage}
                setSlippage={(val) => setButterPageState((prevState) => ({ ...prevState, slippage: val }))}
                batches={butterBatchData?.accountBatches}
                claim={claim}
                claimAndStake={claimAndStake}
                withdraw={withdraw}
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
