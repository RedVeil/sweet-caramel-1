import {
  adjustDepositDecimals,
  ChainId,
  getIndexForToken,
  getMinZapAmount,
  isButterSupportedOnCurrentNetwork,
  percentageToBps,
} from "@popcorn/utils";
import { BatchType, Token } from "@popcorn/utils/src/types";
import { Pages } from "@popcorn/app/components/BatchButter/ButterTokenInput";
import MintRedeemInterface from "@popcorn/app/components/BatchButter/MintRedeemInterface";
import ButterStats from "@popcorn/app/components/ButterStats";
import MainActionButton from "@popcorn/app/components/MainActionButton";
import { setDualActionWideModal } from "@popcorn/app/context/actions";
import { store } from "@popcorn/app/context/store";
import { BigNumber, constants, ethers } from "ethers";
import { isDepositDisabled } from "@popcorn/app/helper/isDepositDisabled";
import useButterWhaleData from "@popcorn/app/hooks/set/useButterWhaleData";
import useButterWhaleProcessing from "@popcorn/app/hooks/set/useButterWhaleProcessing";
import useThreeCurveVirtualPrice from "@popcorn/app/hooks/useThreeCurveVirtualPrice";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";
import { ButterPageState, DEFAULT_BUTTER_PAGE_STATE, getZapDepositAmount } from "./butter";

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
  const router = useRouter();
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

  const threeCrv = useMemo(
    () => butterData?.tokens?.find((token) => token.address === contractAddresses.threeCrv),
    [butterData],
  );
  const butter = useMemo(
    () => butterData?.tokens?.find((token) => token.address === contractAddresses.butter),
    [butterData],
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
    if (!butterData || !butterData?.tokens) {
      return;
    }
    if (butterPageState.initalLoad) {
      setButterPageState({
        ...butterPageState,
        selectedToken: {
          input: threeCrv,
          output: butter,
        },
        tokens: butterData?.tokens,
        redeeming: false,
        initalLoad: false,
        instant: true,
      });
    } else {
      setButterPageState((prevState) => ({
        ...prevState,
        selectedToken: {
          input: butterData?.tokens.find((token) => token.address === prevState.selectedToken.input.address),
          output: butterData?.tokens.find((token) => token.address === prevState.selectedToken.output.address),
        },
        tokens: butterData?.tokens,
      }));
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

  function selectToken(token: Token): void {
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

  async function handleMainAction(
    depositAmount: BigNumber,
    batchType: BatchType,
    stakeImmidiate = false,
  ): Promise<void> {
    depositAmount = await adjustDepositDecimals(depositAmount, butterPageState.selectedToken.input);
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
    depositAmount = await adjustDepositDecimals(depositAmount, butterPageState.selectedToken.input);
    toast.loading(`Depositing ${butterPageState.selectedToken.input.name}...`);
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
    } else {
      return butterWhaleProcessing.mint(depositAmount, percentageToBps(butterPageState.slippage), stakeImmidiate);
    }
  }

  async function instantWithdraw(
    amount: BigNumber,
    useZap?: boolean,
    outputToken?: Token,
  ): Promise<ethers.ContractTransaction> {
    toast.loading(`Withdrawing ${butterPageState.selectedToken.output.name}...`);
    if (useZap) {
      return butterWhaleProcessing.zapRedeem(
        amount,
        getIndexForToken(outputToken),
        (await adjustDepositDecimals(amount, outputToken)).mul(100 - butterPageState.slippage).div(100),
        percentageToBps(butterPageState.slippage),
      );
    }

    return butterWhaleProcessing.redeem(amount, percentageToBps(butterPageState.slippage));
  }

  async function approve(token: Token): Promise<void> {
    toast.loading("Approving Token...");
    await token.contract
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
            <ButterStats token={butter} totalSupply={butterData?.totalSupply} addresses={butterYearnAddresses} center />
          </div>
        </div>
        <div className="mt-10">
          {butterData && butterPageState.selectedToken ? (
            <MintRedeemInterface
              mainAction={handleMainAction}
              approve={approve}
              options={butterPageState.tokens}
              depositDisabled={isDepositDisabled(
                butterData.totalSupply,
                butter,
                butterPageState.selectedToken,
                butterPageState.redeeming,
                butterPageState.depositAmount,
                butterPageState.useUnclaimedDeposits,
              )}
              selectedToken={butterPageState.selectedToken}
              selectToken={selectToken}
              page={Pages.instantButter}
              instant
              showSlippageAdjust
              depositAmount={butterPageState.depositAmount}
              setDepositAmount={(val) => setButterPageState((prevState) => ({ ...prevState, depositAmount: val }))}
              slippage={butterPageState.slippage}
              setSlippage={(val) => setButterPageState((prevState) => ({ ...prevState, slippage: val }))}
              withdrawMode={butterPageState.redeeming}
              setWithdrawMode={(val) => setButterPageState((prevState) => ({ ...prevState, redeeming: val }))}
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
            <ContentLoader viewBox="0 0 450 600" backgroundColor={"#EBE7D4"} foregroundColor={"#d7d5bc"}>
              <rect x="0" y="0" rx="8" ry="8" width="400" height="600" />
            </ContentLoader>
          )}
        </div>
      </div>
    </>
  );
}
