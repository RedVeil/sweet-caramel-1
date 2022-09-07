import { parseEther } from "@ethersproject/units";
import { Dialog, Transition } from "@headlessui/react";
import {
  adjustDepositDecimals,
  ChainId,
  formatAndRoundBigNumber,
  getMinMintAmount,
  isButterSupportedOnCurrentNetwork,
  percentageToBps,
  prepareHotSwap,
} from "@popcorn/utils";
import {
  BatchProcessTokenKey,
  BatchType,
  SelectedToken,
  SignatureDetails,
  Tokens  
} from "@popcorn/utils/src/types";
import BatchProgress from "components/BatchButter/BatchProgress";
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
import { Fragment, useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";
import getSignature, { getZapSignature, permitTypes } from "../../../../utils/src/getSignature";
import abi from "../../../public/ButterBatchZapperAbi.json";

export enum TOKEN_INDEX {
  dai,
  usdc,
  usdt,
}

export function getZapDepositAmount(depositAmount: BigNumber, tokenKey: string): [BigNumber, BigNumber, BigNumber] {
  switch (tokenKey) {
    case "dai":
      return [depositAmount, constants.Zero, constants.Zero];
    case "usdc":
      return [constants.Zero, depositAmount, constants.Zero];
    case "usdt":
      return [constants.Zero, constants.Zero, depositAmount];
  }
}

export interface ButterPageState {
  selectedToken: SelectedToken;
  useZap: boolean;
  depositAmount: BigNumber;
  usdcSignature: SignatureDetails;
  daiSignature: SignatureDetails;
  redeeming: boolean;
  useUnclaimedDeposits: boolean;
  slippage: number;
  initalLoad: boolean;
  tokens: Tokens;
  instant: boolean;
  isThreeX: boolean;
}

export const DEFAULT_BUTTER_PAGE_STATE: ButterPageState = {
  selectedToken: null,
  useZap: false,
  depositAmount: constants.Zero,
  usdcSignature: null,
  daiSignature: null,
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
    rpcProvider,
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
  const butterBatchZapper = useButterBatchZapper();
  const butterBatch = useButterBatch();
  const butterWhaleProcessing = useButterWhaleProcessing();
  const { data: butterWhaleData, error: butterWhaleError, mutate: refetchButterWhaleData } = useButterWhaleData();
  const {
    data: butterBatchData,
    error: errorFetchingButterBatchData,
    mutate: refetchButterBatchData,
  } = useButterBatchData();
  const [butterPageState, setButterPageState] = useState<ButterPageState>(DEFAULT_BUTTER_PAGE_STATE);
  const virtualPrice = useThreeCurveVirtualPrice(contractAddresses?.butterDependency?.threePool);
  const loadingButterBatchData = !butterPageState.selectedToken;
  const butterYearnAddresses = [
    contractAddresses.yFrax,
    contractAddresses.yRai,
    contractAddresses.yMusd,
    contractAddresses.yAlusd,
  ];
  const [showMobileTutorial, toggleMobileTutorial] = useState<boolean>(false);

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
    if (!butterBatchData || !butterBatchData?.tokens || !butterWhaleData || !butterWhaleData?.tokens) {
      return;
    }
    if (butterPageState.initalLoad) {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: butterBatchData?.tokens?.threeCrv?.key,
          output: butterBatchData?.tokens?.butter?.key,
        },
        tokens: butterBatchData?.tokens,
        redeeming: false,
        initalLoad: false,
      });
    } else {
      setButterPageState({
        ...butterPageState,
        tokens: butterPageState.instant ? butterWhaleData?.tokens : butterBatchData?.tokens,
      });
    }
  }, [butterBatchData, butterWhaleData]);

  useEffect(() => {
    setButterPageState({
      ...butterPageState,
      tokens: butterPageState.instant ? butterWhaleData?.tokens : butterBatchData?.tokens,
    });
  }, [butterPageState.instant]);

  useEffect(() => {
    if (!butterBatchData || !butterBatchData?.tokens) {
      return;
    }
    if (butterPageState.redeeming) {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: butterPageState?.tokens?.butter?.key,
          output: butterPageState?.tokens?.threeCrv?.key,
        },
        useZap: false,
        depositAmount: constants.Zero,
        useUnclaimedDeposits: false,
      });
    } else {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: butterPageState?.tokens?.threeCrv?.key,
          output: butterPageState?.tokens?.butter?.key,
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
    onContractSuccess(res, `${butterPageState.tokens[butterPageState.selectedToken.input].name} deposited!`, () => {
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
    toast.loading(`Depositing ${butterPageState.tokens[butterPageState.selectedToken.input].name}...`);
    if (butterPageState.useZap) {
      const virtualPriceValue = await virtualPrice();
      const minMintAmount = getMinMintAmount(
        depositAmount,
        butterPageState.slippage,
        virtualPriceValue,
        ["usdc", "usdt"].includes(butterPageState.selectedToken.input) ? 6 : 18,
      );
      return butterWhaleProcessing.zapMint(
        getZapDepositAmount(depositAmount, butterPageState.selectedToken.input),
        minMintAmount,
        percentageToBps(butterPageState.slippage),
        stakeImmidiate,
      );
    }
    return butterWhaleProcessing.mint(depositAmount, percentageToBps(butterPageState.slippage), stakeImmidiate);
  }
  async function instantRedeem(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading(`Withdrawing ${butterPageState.tokens[butterPageState.selectedToken.output].name}...`);
    if (butterPageState.useZap) {
      return butterWhaleProcessing.zapRedeem(
        depositAmount,
        TOKEN_INDEX[butterPageState.selectedToken.output],
        adjustDepositDecimals(depositAmount, butterPageState.selectedToken.output)
          .mul(100 - butterPageState.slippage)
          .div(100),
        butterPageState.slippage,
      );
    }
    return butterWhaleProcessing.redeem(depositAmount, percentageToBps(butterPageState.slippage));
  }
  async function batchMint(depositAmount: BigNumber): Promise<ethers.ContractTransaction> {
    toast.loading(`Depositing ${butterPageState.tokens[butterPageState.selectedToken.input].name} ...`);
    if (butterPageState.useZap) {
      const virtualPriceValue = await virtualPrice();
      const minMintAmount = getMinMintAmount(
        depositAmount,
        butterPageState.slippage,
        virtualPriceValue,
        ["usdc", "usdt"].includes(butterPageState.selectedToken.input) ? 6 : 18,
      );
      const { deadline, v, r, s, nonce } = getZapSignature(
        butterPageState[`${butterPageState.selectedToken.input}Signature`],
        butterPageState.selectedToken.input,
      );
      return butterBatchZapper.zapIntoBatchPermit(
        getZapDepositAmount(depositAmount, butterPageState.selectedToken.input),
        minMintAmount,
        deadline,
        v,
        r,
        s,
        nonce,
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
    depositAmount = adjustDepositDecimals(depositAmount, butterPageState.selectedToken.input);
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
            .accountClaimableTokenBalance.mul(butterBatchData?.tokens?.threeCrv.price)
            .div(butterBatchData?.tokens[outputToken].price),
          outputToken,
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

  function getCurrentContractAddress(): string {
    if (butterPageState.instant) {
      return butterWhaleProcessing.address;
    }
    if (butterPageState.useZap) {
      return butterBatchZapper.address;
    }
    return butterBatch.address;
  }

  async function approve(contractKey: string): Promise<void> {
    toast.loading("Approving Token...");
    const selectedTokenContract = butterBatchData?.batchProcessTokens[contractKey].contract;
    if (
      getCurrentContractAddress() === butterBatchZapper.address &&
      (contractKey === "dai" || contractKey === "usdc")
    ) {
      const valueAdjusted =
        butterPageState.selectedToken.input === "usdc"
          ? butterPageState.depositAmount.div(1e12)
          : butterPageState.depositAmount;

      await getSignature(
        rpcProvider,
        signerOrProvider,
        butterPageState.selectedToken.input === "usdc" ? permitTypes.AMOUNT : permitTypes.ALLOWED,
        account,
        butterBatchZapper.address,
        selectedTokenContract,
        chainId,
        valueAdjusted,
      ).then(
        (res) => {
          toast.dismiss();
          toast.success("Token approved!");
          setButterPageState({
            ...butterPageState,
            [`${contractKey}Signature`]: {
              v: res.v,
              r: res.r,
              s: res.s,
              deadline: res.deadline,
              value: res.value,
              nonce: res.nonce,
            },
          });
          refetchButterBatchData();
        },
        (err) => onContractError(err),
      );
    } else {
      await selectedTokenContract.approve(getCurrentContractAddress(), ethers.constants.MaxUint256).then(
        (res) =>
          onContractSuccess(res, "Token approved!", () => {
            refetchButterBatchData();
          }),
        (err) => onContractError(err),
      );
    }
  }

  function getBatchProgressAmount(): BigNumber {
    if (!butterBatchData) {
      return constants.Zero;
    }
    return butterPageState.redeeming
      ? butterBatchData?.currentBatches.redeem.suppliedTokenBalance
          .mul(butterBatchData?.tokens?.butter.price)
          .div(parseEther("1"))
      : butterBatchData?.currentBatches.mint.suppliedTokenBalance
          .mul(butterBatchData?.tokens?.threeCrv.price)
          .div(parseEther("1"));
  }

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 md:col-span-5">
          <h1 className="text-6xl leading-12">Butter - Yield Optimizer</h1>
          <p className="mt-4 leading-5 text-primaryDark">
            Mint 3X and earn interest on multiple stablecoins at once. Stake your 3X to earn boosted APY.
          </p>
          <ButterStats butterData={butterBatchData} addresses={butterYearnAddresses} />
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
                    token={butterBatchData?.tokens}
                    selectToken={selectToken}
                    mainAction={handleMainAction}
                    approve={approve}
                    depositDisabled={isDepositDisabled(butterBatchData, butterPageState)}
                    hasUnclaimedBalances={hasClaimableBalances()}
                    butterPageState={[butterPageState, setButterPageState]}
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
                content={`$${
                  butterBatchData?.tokens?.butter
                    ? formatAndRoundBigNumber(
                        butterBatchData?.tokens?.butter?.price,
                        butterPageState?.tokens?.butter?.decimals,
                      )
                    : "-"
                }`}
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
                batches={butterBatchData?.accountBatches}
                claim={claim}
                claimAndStake={claimAndStake}
                withdraw={withdraw}
                butterPageState={[butterPageState, setButterPageState]}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="py-6 hidden md:block">
        <img src="/images/nature.png" alt="" className=" rounded-lg w-full object-cover" />
      </div>
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
