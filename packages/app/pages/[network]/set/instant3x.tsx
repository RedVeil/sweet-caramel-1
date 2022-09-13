import { ThreeXWhaleProcessing } from "@popcorn/hardhat/typechain";
import { adjustDepositDecimals, ChainId, formatAndRoundBigNumber, getMinMintAmount, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import { BatchMetadata, BatchProcessTokenKey, BatchType } from "@popcorn/utils/src/types";
import MintRedeemInterface from "components/BatchButter/MintRedeemInterface";
import ButterStats from "components/ButterStats";
import MainActionButton from "components/MainActionButton";
import TransactionToast from "components/Notifications/TransactionToast";
import { setDualActionWideModal } from "context/actions";
import { store } from "context/store";
import { BigNumber, constants, ethers } from "ethers";
import { isDepositDisabled } from "helper/isDepositDisabled";
import useThreeXWhale from "hooks/set/useThreeXWhale";
import useThreeXWhaleData from "hooks/set/useThreeXWhaleData";
import useApproveERC20 from "hooks/tokens/useApproveERC20";
import useWeb3 from "hooks/useWeb3";
import { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import { TOKEN_INDEX } from "./3x";
import { ButterPageState, DEFAULT_BUTTER_PAGE_STATE } from "./butter";

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
  const approveToken = useApproveERC20();

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
      await instantRedeem(threeXWhale, depositAmount, threeXPageState, threeXWhaleData)
    } else {
      await instantMint(threeXWhale, depositAmount, threeXPageState, threeXWhaleData, stakeImmidiate)
    }
    await refetchThreeXData();
    setThreeXPageState((state) => ({ ...state, depositAmount: constants.Zero }));
  }

  async function instantMint(
    threeXWhale: ThreeXWhaleProcessing,
    depositAmount: BigNumber,
    pageState: ButterPageState,
    batchData: BatchMetadata,
    stakeImmidiate: boolean,
  ): Promise<void> {
    const formatedDepositAmount = formatAndRoundBigNumber(depositAmount, pageState.selectedToken.input === "dai" ? 18 : 6);
    const inputTokenName = pageState.selectedToken.input.toUpperCase()

    TransactionToast.loading(
      {
        title: "ZapMinting",
        description: `${formatedDepositAmount} ${inputTokenName} to 3X`
      })

    return threeXWhale["mint(uint256,int128,int128,uint256,bool)"](
      depositAmount,
      TOKEN_INDEX[pageState.selectedToken.input],
      TOKEN_INDEX.usdc,
      getMinMintAmount(
        depositAmount,
        pageState.slippage,
        batchData.tokens.threeX.price,
        pageState.selectedToken.input === "dai" ? 18 : 6,
        18,
      ),
      stakeImmidiate,
    ).then(
      (res) =>
        onContractSuccess(
          res,
          {
            title: "ZapMinted successfully",
            description: `${formatedDepositAmount} ${inputTokenName} to 3X`
          },
        ),
      (err) => onContractError(err, `ZapMinting ${formatedDepositAmount} ${inputTokenName}`))
  }

  async function instantRedeem(
    threeXWhale: ThreeXWhaleProcessing,
    depositAmount: BigNumber,
    pageState: ButterPageState,
    batchData: BatchMetadata,
  ): Promise<void> {
    const formatedDepositAmount = formatAndRoundBigNumber(depositAmount, 18)
    const outputTokenName = pageState.tokens[pageState.selectedToken.output].name

    TransactionToast.loading(
      {
        title: "ZapRedeeming",
        description: `${formatedDepositAmount} 3X to ${outputTokenName}`
      })

    return threeXWhale["redeem(uint256,int128,int128,uint256)"](
      depositAmount,
      TOKEN_INDEX.usdc,
      TOKEN_INDEX[pageState.selectedToken.output],
      0,
    ).then(
      (res) =>
        onContractSuccess(
          res,
          {
            title: "ZapRedeemed successfully",
            description: `${formatedDepositAmount} 3X to ${outputTokenName}`
          },
        ),
      (err) => onContractError(err, `ZapRedeeming ${formatedDepositAmount} 3X`))
  }

  async function approve(contractKey: string): Promise<void> {
    const selectedInputToken = threeXWhaleData?.tokens[contractKey];

    const toastDescription = `${selectedInputToken.symbol} for Instant Processing`
    TransactionToast.loading({ title: "Approving", description: toastDescription })

    await approveToken(
      selectedInputToken.contract,
      threeXWhale.address,
      { title: "Approved successfully", description: toastDescription },
      `Approving ${toastDescription} `,
      () => refetchThreeXData())
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
              depositDisabled={isDepositDisabled(threeXWhaleData, threeXPageState)}
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
