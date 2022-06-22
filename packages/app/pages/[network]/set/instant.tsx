import {
  adjustDepositDecimals,
  ChainId,
  getMinMintAmount,
  isButterSupportedOnCurrentNetwork,
  percentageToBps,
} from "@popcorn/utils";
import { BatchProcessTokenKey, BatchType } from "@popcorn/utils/src/types";
import MintRedeemInterface from "components/BatchButter/MintRedeemInterface";
import ButterStats from "components/ButterStats";
import MainActionButton from "components/MainActionButton";
import { setDualActionWideModal } from "context/actions";
import { store } from "context/store";
import { BigNumber, constants, ethers } from "ethers";
import useButterWhaleData from "hooks/butter/useButterWhaleData";
import useButterWhaleProcessing from "hooks/butter/useButterWhaleProcessing";
import useThreeCurveVirtualPrice from "hooks/useThreeCurveVirtualPrice";
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";
import {
  ButterPageState,
  DEFAULT_BUTTER_PAGE_STATE,
  getZapDepositAmount,
  isDepositDisabled,
  TOKEN_INDEX,
} from "./butter";

export default function InstantButter() {
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
  const butterWhaleProcessing = useButterWhaleProcessing();
  const { data: butterData, error: errorFetchingButterData, mutate: refetchButterData } = useButterWhaleData();
  const [butterPageState, setButterPageState] = useState<ButterPageState>(DEFAULT_BUTTER_PAGE_STATE);
  const virtualPrice = useThreeCurveVirtualPrice(contractAddresses?.butterDependency?.threePool);
  const loadingButterBatchData = !butterData && !errorFetchingButterData;
  const butterYearnAddresses = [
    contractAddresses.yFrax,
    contractAddresses.yRai,
    contractAddresses.yMusd,
    contractAddresses.yAlusd,
  ];

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
    if (!butterData || !butterData?.tokens) {
      return;
    }
    if (butterPageState.initalLoad) {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: butterData?.tokens?.threeCrv?.key,
          output: butterData?.tokens?.butter?.key,
        },
        tokens: butterData?.tokens,
        redeeming: false,
        initalLoad: false,
        instant: true,
      });
    } else {
      setButterPageState({
        ...butterPageState,
        tokens: butterData?.tokens,
      });
    }
  }, [butterData]);

  useEffect(() => {
    if (!butterData || !butterData?.tokens) {
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

  async function handleMainAction(
    depositAmount: BigNumber,
    batchType: BatchType,
    stakeImmidiate = false,
  ): Promise<void> {
    depositAmount = adjustDepositDecimals(depositAmount, butterPageState.selectedToken.input);
    if (butterPageState.redeeming) {
      await instantWithdraw(depositAmount).then(
        (res) => onContractSuccess(res, "Butter redeemed!"),
        (err) => onContractError(err),
      );
    } else {
      await instantMint(depositAmount, batchType, stakeImmidiate).then(
        (res) => onContractSuccess(res, "Butter minted!"),
        (err) => onContractError(err),
      );
    }
    await refetchButterData();
    setButterPageState({ ...butterPageState, depositAmount: constants.Zero });
  }

  async function instantMint(
    depositAmount: BigNumber,
    _batchType: BatchType,
    stakeImmidiate: boolean,
  ): Promise<ethers.ContractTransaction> {
    // Batchtype is included to remain compliant with the interface provided by MintRedeemInterface but in not required for the instaMint version.
    depositAmount = adjustDepositDecimals(depositAmount, butterPageState.selectedToken.input);
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
    } else {
      return butterWhaleProcessing.mint(depositAmount, percentageToBps(butterPageState.slippage), stakeImmidiate);
    }
  }

  async function instantWithdraw(
    amount: BigNumber,
    useZap?: boolean,
    outputToken?: string,
  ): Promise<ethers.ContractTransaction> {
    toast.loading(`Withdrawing ${butterPageState.tokens[butterPageState.selectedToken.output].name}...`);
    if (useZap) {
      return butterWhaleProcessing.zapRedeem(
        amount,
        TOKEN_INDEX[outputToken],
        adjustDepositDecimals(amount, outputToken)
          .mul(100 - butterPageState.slippage)
          .div(100),
        percentageToBps(butterPageState.slippage),
      );
    }

    return butterWhaleProcessing.redeem(amount, percentageToBps(butterPageState.slippage));
  }

  async function approve(contractKey: string): Promise<void> {
    toast.loading("Approving Token...");
    await butterData?.tokens[contractKey].contract
      .approve(butterWhaleProcessing.address, ethers.constants.MaxUint256)
      .then((res) =>
        onContractSuccess(res, "Token approved!", () => {
          refetchButterData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  return (
    <>
      <div className="max-w-2xl px-4 flex flex-col justify-center mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-custom p-8">
          <h1 className="text-3xl font-bold text-center">Butter - Yield Optimizer</h1>
          <p className="mt-2 text-lg text-gray-500 text-center">
            Mint BTR and earn interest on multiple stablecoins at once.
            <br />
            Stake your BTR to earn boosted APY.
          </p>
          <div className="mx-auto">
            <ButterStats butterData={butterData} addresses={butterYearnAddresses} center />
          </div>
        </div>
        <div className="mt-10">
          {butterData && butterPageState.selectedToken ? (
            <MintRedeemInterface
              token={butterData?.tokens}
              selectToken={selectToken}
              mainAction={handleMainAction}
              approve={approve}
              depositDisabled={isDepositDisabled(
                butterPageState.depositAmount,
                butterPageState.tokens[butterPageState.selectedToken.input].balance,
              )}
              hasUnclaimedBalances={false}
              butterPageState={[butterPageState, setButterPageState]}
              isInstantPage
            />
          ) : (
            <>
              {!account && (
                <div className="h-full px-5 pt-6 bg-white border border-gray-200 rounded-3xl pb-14 laptop:pb-18 shadow-custom">
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
          {account && !butterData && loadingButterBatchData && (
            <ContentLoader viewBox="0 0 500 600">
              <rect x="0" y="0" rx="20" ry="20" width="500" height="600" />
            </ContentLoader>
          )}
        </div>
      </div>
    </>
  );
}
