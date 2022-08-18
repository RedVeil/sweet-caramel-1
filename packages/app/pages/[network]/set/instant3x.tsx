import { adjustDepositDecimals, ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchProcessTokenKey, BatchType } from "@popcorn/utils/src/types";
import MintRedeemInterface from "components/BatchButter/MintRedeemInterface";
import ButterStats from "components/ButterStats";
import MainActionButton from "components/MainActionButton";
import { setDualActionWideModal } from "context/actions";
import { store } from "context/store";
import { BigNumber, constants, ethers } from "ethers";
import useThreeXWhale from "hooks/butter/useThreeXWhale";
import useThreeXWhaleData from "hooks/butter/useThreeXWhaleData";
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import toast from "react-hot-toast";
import { instantMint, instantRedeem } from "./3x";
import { ButterPageState, DEFAULT_BUTTER_PAGE_STATE, isDepositDisabled } from "./butter";

const ZAP_TOKEN = ["dai", "usdt"];

export default function Instant3x() {
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
  const threeXWhale = useThreeXWhale();
  const {
    data: threeXWhaleData,
    error: errorFetchingThreeXWhaleData,
    mutate: refetchThreeXData,
  } = useThreeXWhaleData();
  const [threeXPageState, setThreeXPageState] = useState<ButterPageState>(DEFAULT_BUTTER_PAGE_STATE);
  const loadingThreeXData = !threeXWhaleData && !errorFetchingThreeXWhaleData;

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
    if (!threeXWhaleData || !threeXWhaleData?.tokens) {
      return;
    }
    setThreeXPageState((state) =>
      state.initalLoad
        ? {
            ...state,
            selectedToken: {
              input: threeXWhaleData?.tokens?.usdc?.key,
              output: threeXWhaleData?.tokens?.threeX?.key,
            },
            tokens: threeXWhaleData?.tokens,
            redeeming: false,
            initalLoad: false,
            isThreeX: true,
            instant: true,
          }
        : {
            ...state,
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
        input: state.redeeming ? state?.tokens?.threeX?.key : state?.tokens?.usdc?.key,
        output: state.redeeming ? state?.tokens?.usdc?.key : state?.tokens?.threeX?.key,
      },
      useZap: false,
      depositAmount: constants.Zero,
      useUnclaimedDeposits: false,
    }));
  }, [threeXPageState.redeeming]);

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

  async function handleMainAction(
    depositAmount: BigNumber,
    _batchType: BatchType,
    stakeImmidiate = false,
  ): Promise<void> {
    depositAmount = adjustDepositDecimals(depositAmount, threeXPageState.selectedToken.input);
    if (threeXPageState.redeeming) {
      await instantRedeem(threeXWhale, depositAmount, threeXPageState, threeXWhaleData).then(
        (res) => onContractSuccess(res, "3x redeemed!"),
        (err) => onContractError(err),
      );
    } else {
      await instantMint(threeXWhale, depositAmount, threeXPageState, threeXWhaleData, stakeImmidiate).then(
        (res) => onContractSuccess(res, "3x minted!"),
        (err) => onContractError(err),
      );
    }
    await refetchThreeXData();
    setThreeXPageState((state) => ({ ...state, depositAmount: constants.Zero }));
  }

  async function approve(contractKey: string): Promise<void> {
    toast.loading("Approving Token...");
    const selectedTokenContract = threeXWhaleData?.tokens[contractKey].contract;
    await selectedTokenContract
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
            <ButterStats
              butterData={threeXWhaleData}
              addresses={[contractAddresses.ySusd, contractAddresses.y3Eur]}
              center
              isThreeX
            />
          </div>
        </div>
        <div className="mt-10">
          {threeXWhaleData && threeXPageState.selectedToken ? (
            <MintRedeemInterface
              token={threeXWhaleData?.tokens}
              selectToken={selectToken}
              mainAction={handleMainAction}
              approve={approve}
              depositDisabled={isDepositDisabled(
                threeXPageState.depositAmount,
                threeXPageState?.tokens[threeXPageState.selectedToken.input].balance,
              )}
              hasUnclaimedBalances={false}
              butterPageState={[threeXPageState, setThreeXPageState]}
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
