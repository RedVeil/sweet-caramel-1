import { Pages } from "@popcorn/app/components/BatchButter/ButterTokenInput";
import MintRedeemInterface from "@popcorn/app/components/BatchButter/MintRedeemInterface";
import MainActionButton from "@popcorn/app/components/MainActionButton";
import SetStats from "@popcorn/app/components/SetStats";
import { setDualActionWideModal } from "@popcorn/app/context/actions";
import { store } from "@popcorn/app/context/store";
import { isDepositDisabled } from "@popcorn/app/helper/isDepositDisabled";
import useThreeXWhale from "@popcorn/app/hooks/set/useThreeXWhale";
import useThreeXWhaleData from "@popcorn/app/hooks/set/useThreeXWhaleData";
import { useAdjustDepositDecimals } from "@popcorn/app/hooks/useAdjustDepositDecimals";
import { useChainIdFromUrl } from "@popcorn/app/hooks/useChainIdFromUrl";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { instantMint, instantRedeem } from "@popcorn/app/pages/[network]/set/3x";
import { ButterPageState, DEFAULT_BUTTER_PAGE_STATE } from "@popcorn/app/pages/[network]/set/butter";
import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchType, Token } from "@popcorn/utils/src/types";
import { BigNumber, constants, ethers } from "ethers";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";

export default function Instant3x() {
  const {
    signerOrProvider,
    account,
    onContractSuccess,
    onContractError,
    contractAddresses,
    connect,
    setChain,
    signer,
  } = useWeb3();
  const chainId = useChainIdFromUrl();
  const { dispatch } = useContext(store);
  const threeXWhale = useThreeXWhale(contractAddresses.threeXWhale, chainId);
  const {
    data: threeXWhaleData,
    error: errorFetchingThreeXWhaleData,
    mutate: refetchThreeXData,
  } = useThreeXWhaleData(chainId);
  const router = useRouter();
  const adjustDepositDecimals = useAdjustDepositDecimals(chainId);
  const [threeXPageState, setThreeXPageState] = useState<ButterPageState>(DEFAULT_BUTTER_PAGE_STATE);
  const loadingThreeXData = !threeXWhaleData && !errorFetchingThreeXWhaleData;

  const ZAP_TOKEN = [contractAddresses.dai, contractAddresses.usdt];

  const threeX = useMemo(
    () => threeXWhaleData?.tokens?.find((token) => token.address === contractAddresses.threeX),
    [threeXPageState, threeXWhaleData],
  );

  const usdc = useMemo(
    () => threeXWhaleData?.tokens?.find((token) => token.address === contractAddresses.usdc),
    [threeXPageState, threeXWhaleData],
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
    if (!threeXWhaleData || !threeXWhaleData?.tokens) {
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
            tokens: threeXWhaleData?.tokens,
            redeeming: false,
            initalLoad: false,
            isThreeX: true,
            instant: true,
          }
        : {
            ...state,
            selectedToken: {
              input: threeXWhaleData?.tokens.find((token) => token.address === state.selectedToken.input.address),
              output: threeXWhaleData?.tokens.find((token) => token.address === state.selectedToken.output.address),
            },
            tokens: threeXWhaleData?.tokens,
          },
    );
  }, [threeXWhaleData]);

  useEffect(() => {
    if (!threeXWhaleData || !threeXWhaleData?.tokens) {
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

  async function handleMainAction(
    depositAmount: BigNumber,
    _batchType: BatchType,
    stakeImmidiate = false,
  ): Promise<void> {
    depositAmount = await adjustDepositDecimals(depositAmount, threeXPageState.selectedToken.input);
    if (threeXPageState.redeeming) {
      await instantRedeem(threeXWhale, depositAmount, threeXPageState, signer).then(
        (res) => onContractSuccess(res, "3x redeemed!"),
        (err) => onContractError(err),
      );
    } else {
      await instantMint(threeXWhale, depositAmount, threeXPageState, threeX.price, stakeImmidiate, signer).then(
        (res) => onContractSuccess(res, "3x minted!"),
        (err) => onContractError(err),
      );
    }
    await refetchThreeXData();
    setThreeXPageState((state) => ({ ...state, depositAmount: constants.Zero }));
  }

  async function approve(token: Token): Promise<void> {
    toast.loading("Approving Token...");
    await token.contract
      .approve(threeXWhale.address, ethers.constants.MaxUint256)
      .then((res) =>
        onContractSuccess(res, "Token approved!", () => {
          refetchThreeXData();
        }),
      )
      .catch((err) => onContractError(err));
  }

  return (
    <>
      <div className="max-w-2xl px-4 flex flex-col justify-center mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-custom p-8">
          <h1 className="text-3xl font-bold text-center">3X - Yield Optimizer</h1>
          <p className="mt-2 text-lg text-gray-500 text-center">
            Mint 3X and earn interest on multiple stablecoins at once.
            <br />
            Stake your 3X to earn boosted APY.
          </p>
          <div className="mx-auto">
            <SetStats token={threeX} />
          </div>
        </div>
        <div className="mt-10">
          {threeXWhaleData && threeXPageState.selectedToken ? (
            <MintRedeemInterface
              chainId={chainId}
              options={threeXWhaleData.tokens}
              selectToken={selectToken}
              mainAction={handleMainAction}
              approve={approve}
              depositDisabled={isDepositDisabled(
                threeXWhaleData.totalSupply,
                threeX,
                threeXPageState.selectedToken,
                threeXPageState.redeeming,
                threeXPageState.depositAmount,
                threeXPageState.useUnclaimedDeposits,
                true,
              )}
              page={Pages.instantThreeX}
              instant
              depositAmount={threeXPageState.depositAmount}
              setDepositAmount={(val) => setThreeXPageState((prevState) => ({ ...prevState, depositAmount: val }))}
              showSlippageAdjust={true}
              slippage={threeXPageState.slippage}
              setSlippage={(val) => setThreeXPageState((prevState) => ({ ...prevState, slippage: val }))}
              withdrawMode={threeXPageState.redeeming}
              setWithdrawMode={(val) => setThreeXPageState((prevState) => ({ ...prevState, redeeming: val }))}
              selectedToken={threeXPageState.selectedToken}
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
          {account && !threeXWhaleData && loadingThreeXData && (
            <ContentLoader viewBox="0 0 500 600">
              <rect x="0" y="0" rx="20" ry="20" width="500" height="600" />
            </ContentLoader>
          )}
        </div>
      </div>
    </>
  );
}
