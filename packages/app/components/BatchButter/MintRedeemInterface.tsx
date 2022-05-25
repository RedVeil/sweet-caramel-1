import { BatchType } from "@popcorn/utils/src/types";
import { BigNumber, constants, ethers } from "ethers";
import MainActionButton from "../MainActionButton";
import ButterTokenInput, { ButterTokenInputProps } from "./ButterTokenInput";
import { CheckMarkToggleWithInfo } from "./CheckMarkToggleWithInfo";
import MintRedeemToggle from "./MintRedeemToggle";
import SlippageSettings from "./SlippageSettings";
interface MintRedeemInterfaceProps extends ButterTokenInputProps {
  deposit: (depositAmount: BigNumber, batchType: BatchType) => Promise<void>;
  approve: (contractKey: string) => Promise<void>;
  hasUnclaimedBalances: boolean;
  permit: Function;
  withdraw?: (amount: BigNumber, useZap?: boolean, outputToken?: string) => Promise<void>;
  isInstantPage?: boolean;
}

const MintRedeemInterface: React.FC<MintRedeemInterfaceProps> = ({
  token,
  selectToken,
  deposit,
  approve,
  depositDisabled,
  butterPageState,
  permit,
  withdraw,
  hasUnclaimedBalances = false,
  isInstantPage = false,
}) => {
  const [localButterPageState, setButterPageState] = butterPageState;

  function isAllowanceInsufficient() {
    return localButterPageState.instant
      ? localButterPageState.depositAmount.gt(
          localButterPageState.whaleToken[localButterPageState.selectedToken.input].allowance,
        ) ||
          localButterPageState.whaleToken[localButterPageState.selectedToken.input].allowance.eq(ethers.constants.Zero)
      : localButterPageState.depositAmount.gt(
          localButterPageState.batchToken[localButterPageState.selectedToken.input].allowance,
        ) ||
          localButterPageState.batchToken[localButterPageState.selectedToken.input].allowance.eq(ethers.constants.Zero);
  }

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
        {hasUnclaimedBalances && localButterPageState.useUnclaimedDeposits ? (
          <div className="pt-6">
            <MainActionButton
              label={localButterPageState.redeeming ? "Redeem" : "Mint"}
              handleClick={() =>
                deposit(
                  localButterPageState.depositAmount,
                  localButterPageState.redeeming ? BatchType.Redeem : BatchType.Mint,
                )
              }
              disabled={depositDisabled || localButterPageState.depositAmount.eq(constants.Zero)}
            />
          </div>
        ) : (
          <>
            {isAllowanceInsufficient() ? (
              <div className="space-y-6">
                <MainActionButton
                  label={`${permit ? "Permit" : "Allow"} Popcorn to use your ${
                    localButterPageState.batchToken[localButterPageState.selectedToken.input].name
                  }`}
                  handleClick={() => (permit ? permit() : approve(localButterPageState.selectedToken.input))}
                />
                <MainActionButton
                  label={localButterPageState.redeeming ? "Redeem" : "Mint"}
                  handleClick={() =>
                    deposit(
                      localButterPageState.depositAmount,
                      localButterPageState.redeeming ? BatchType.Redeem : BatchType.Mint,
                    )
                  }
                  disabled={true}
                />
              </div>
            ) : (
              <div className="pt-6">
                <MainActionButton
                  label={localButterPageState.redeeming ? "Redeem" : "Mint"}
                  handleClick={() => {
                    if (localButterPageState.redeeming && withdraw) {
                      withdraw(
                        localButterPageState.depositAmount,
                        localButterPageState.useZap,
                        localButterPageState.selectedToken.output,
                      );
                    } else if (localButterPageState.redeeming) {
                      deposit(localButterPageState.depositAmount, BatchType.Redeem);
                    } else {
                      deposit(localButterPageState.depositAmount, BatchType.Mint);
                    }
                  }}
                  disabled={depositDisabled || localButterPageState.depositAmount.eq(constants.Zero)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default MintRedeemInterface;
