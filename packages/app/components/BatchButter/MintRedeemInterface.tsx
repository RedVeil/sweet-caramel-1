import { BatchType } from "@popcorn/utils/src/types";
import SecondaryActionButton from "components/SecondaryActionButton";
import { BigNumber, constants, ethers } from "ethers";
import { useMemo } from "react";
import MainActionButton from "../MainActionButton";
import ButterTokenInput, { ButterTokenInputProps } from "./ButterTokenInput";
import { CheckMarkToggleWithInfo } from "./CheckMarkToggleWithInfo";
import MintRedeemToggle from "./MintRedeemToggle";
import SlippageSettings from "./SlippageSettings";
interface MintRedeemInterfaceProps extends ButterTokenInputProps {
  mainAction: (depositAmount: BigNumber, batchType: BatchType, stakeImmidiate?: boolean) => Promise<void>;
  approve: (contractKey: string) => Promise<void>;
  hasUnclaimedBalances?: boolean;
  isInstantPage?: boolean;
}

const MintRedeemInterface: React.FC<MintRedeemInterfaceProps> = ({
  token,
  selectToken,
  mainAction,
  approve,
  depositDisabled,
  butterPageState,
  hasUnclaimedBalances = false,
  isInstantPage = false,
}) => {
  const [localButterPageState, setButterPageState] = butterPageState;

  const isAllowanceInsufficient = useMemo(() => {
    if (localButterPageState.selectedToken.input === "usdc") {
      return localButterPageState.instant
        ? localButterPageState.depositAmount
            .div(1e12)
            .gt(localButterPageState.whaleToken[localButterPageState.selectedToken.input].allowance)
        : localButterPageState.depositAmount
            .div(1e12)
            .gt(localButterPageState.batchToken[localButterPageState.selectedToken.input].signatureData?.value || 0);
    } else if (localButterPageState.selectedToken.input === "dai") {
      return localButterPageState.instant
        ? localButterPageState.depositAmount.gt(
            localButterPageState.whaleToken[localButterPageState.selectedToken.input].allowance,
          )
        : localButterPageState.depositAmount.gt(
            localButterPageState.batchToken[localButterPageState.selectedToken.input].signatureData?.value || 0,
          );
    }
    return localButterPageState.instant
      ? localButterPageState.depositAmount.gt(
          localButterPageState.whaleToken[localButterPageState.selectedToken.input].allowance,
        ) ||
          localButterPageState.whaleToken[localButterPageState.selectedToken.input].allowance.eq(ethers.constants.Zero)
      : localButterPageState.depositAmount.gt(
          localButterPageState.batchToken[localButterPageState.selectedToken.input].allowance,
        ) ||
          localButterPageState.batchToken[localButterPageState.selectedToken.input].allowance.eq(ethers.constants.Zero);
  }, [localButterPageState, localButterPageState.selectedToken, localButterPageState.batchToken.usdc.signatureData]);

  function setRedeeming(redeeming: boolean) {
    setButterPageState({ ...localButterPageState, redeeming: redeeming });
  }
  function setSlippage(slippage: number) {
    setButterPageState({ ...localButterPageState, slippage: slippage });
  }
  return (
    <div className="bg-white rounded-3xl px-5 pt-6 pb-6 border border-gray-200 shadow-custom">
      <MintRedeemToggle redeeming={localButterPageState.redeeming} setRedeeming={setRedeeming} />
      <div>
        <ButterTokenInput
          token={token}
          selectToken={selectToken}
          depositDisabled={depositDisabled}
          hasUnclaimedBalances={hasUnclaimedBalances}
          butterPageState={butterPageState}
        />
      </div>
      {!localButterPageState.useUnclaimedDeposits && !isInstantPage && (
        <div className="mt-2 mb-6">
          <CheckMarkToggleWithInfo
            label="Use Instant Butter (Higher Gas Fee)"
            value={localButterPageState.instant}
            onChange={(e) =>
              setButterPageState({
                ...localButterPageState,
                instant: !localButterPageState.instant,
              })
            }
            infoTitle="Instant Butter"
            infoText="Using 'Instant Butter' comes with significantly higher gas costs! Mint/redeem Butter in one transaction without having to wait for a batch to process. Use this feature only when these gas costs are acceptable to you."
          />
        </div>
      )}
      {(localButterPageState.instant ||
        isInstantPage ||
        (!localButterPageState.redeeming && localButterPageState.selectedToken.input !== "threeCrv")) && (
        <div className="w-full pb-8">
          <SlippageSettings slippage={localButterPageState.slippage} setSlippage={setSlippage} />
        </div>
      )}
      <div className="w-full text-center">
        {hasUnclaimedBalances && localButterPageState.useUnclaimedDeposits && (
          <div className="pt-6">
            <MainActionButton
              label={localButterPageState.redeeming ? "Redeem" : "Mint"}
              handleClick={() =>
                mainAction(
                  localButterPageState.depositAmount,
                  localButterPageState.redeeming ? BatchType.Redeem : BatchType.Mint,
                )
              }
              disabled={depositDisabled || localButterPageState.depositAmount.eq(constants.Zero)}
            />
          </div>
        )}
        {!(hasUnclaimedBalances && localButterPageState.useUnclaimedDeposits) && isAllowanceInsufficient && (
          <div className="space-y-6">
            <MainActionButton
              label={`Allow Popcorn to use your ${
                localButterPageState.batchToken[localButterPageState.selectedToken.input].name
              }`}
              handleClick={() => approve(localButterPageState.selectedToken.input)}
            />
            <MainActionButton
              label={localButterPageState.redeeming ? "Redeem" : "Mint"}
              handleClick={() =>
                mainAction(
                  localButterPageState.depositAmount,
                  localButterPageState.redeeming ? BatchType.Redeem : BatchType.Mint,
                )
              }
              disabled={true}
            />
          </div>
        )}
        {!(hasUnclaimedBalances && localButterPageState.useUnclaimedDeposits) && !isAllowanceInsufficient && (
          <div className="pt-6">
            {localButterPageState.instant && !localButterPageState.redeeming ? (
              <>
                <MainActionButton
                  label="Mint & Stake"
                  handleClick={() => {
                    mainAction(localButterPageState.depositAmount, BatchType.Mint, true);
                  }}
                  disabled={depositDisabled || localButterPageState.depositAmount.eq(constants.Zero)}
                />
                <SecondaryActionButton
                  label="Mint"
                  handleClick={() => {
                    mainAction(localButterPageState.depositAmount, BatchType.Mint, false);
                  }}
                  disabled={depositDisabled || localButterPageState.depositAmount.eq(constants.Zero)}
                />
              </>
            ) : (
              <MainActionButton
                label={localButterPageState.redeeming ? "Redeem" : "Mint"}
                handleClick={() => {
                  if (localButterPageState.redeeming) {
                    mainAction(localButterPageState.depositAmount, BatchType.Redeem);
                  } else {
                    mainAction(localButterPageState.depositAmount, BatchType.Mint);
                  }
                }}
                disabled={depositDisabled || localButterPageState.depositAmount.eq(constants.Zero)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default MintRedeemInterface;
