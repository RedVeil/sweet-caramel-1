import { BatchType } from "@popcorn/utils/src/types";
import { InfoIconWithModal } from "components/InfoIconWithModal";
import SecondaryActionButton from "components/SecondaryActionButton";
import { BigNumber, constants, ethers } from "ethers";
import Link from "next/link";
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
  isThreeXPage?: boolean;
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
  isThreeXPage = false,
}) => {
  const [localButterPageState, setButterPageState] = butterPageState;

  function isAllowanceInsufficient() {
    return (
      localButterPageState.depositAmount.gt(
        localButterPageState.tokens[localButterPageState.selectedToken.input].allowance,
      ) || localButterPageState.tokens[localButterPageState.selectedToken.input].allowance.eq(ethers.constants.Zero)
    );
  }

  function setRedeeming(redeeming: boolean) {
    setButterPageState({ ...localButterPageState, redeeming: redeeming });
  }
  function setSlippage(slippage: number) {
    setButterPageState({ ...localButterPageState, slippage: slippage });
  }
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-custom">
      <MintRedeemToggle
        redeeming={localButterPageState.redeeming}
        setRedeeming={setRedeeming}
        isThreeX={localButterPageState.isThreeX}
      />
      <div>
        <ButterTokenInput
          token={token}
          selectToken={selectToken}
          depositDisabled={depositDisabled}
          hasUnclaimedBalances={hasUnclaimedBalances}
          butterPageState={butterPageState}
        />
      </div>
      {!localButterPageState.useUnclaimedDeposits && !isInstantPage && !isThreeXPage && (
        <div className="mt-2">
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
            infoText="Using 'Instant Butter' comes with higher gas costs. Mint/redeem Butter in one transaction without having to wait for a batch to process. Use this feature only when the gas costs are acceptable to you."
          />
        </div>
      )}
      {(localButterPageState.instant ||
        isInstantPage ||
        (!localButterPageState.redeeming && localButterPageState.useZap)) && (
        <div className="w-full mt-6">
          <SlippageSettings slippage={localButterPageState.slippage} setSlippage={setSlippage} />
        </div>
      )}
      <hr className="mt-10" />
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
        {!(hasUnclaimedBalances && localButterPageState.useUnclaimedDeposits) && isAllowanceInsufficient() && (
          <div className="pt-6 space-y-6">
            <MainActionButton
              label={`Allow Popcorn to use your ${
                localButterPageState.tokens[localButterPageState.selectedToken.input].name
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
        {!(hasUnclaimedBalances && localButterPageState.useUnclaimedDeposits) && !isAllowanceInsufficient() && (
          <div className="pt-6 space-y-6">
            {localButterPageState.instant && !localButterPageState.redeeming ? (
              <>
                <span className="text-left flex flex-row items-center">
                  <p>Mint & Stake vs. Mint</p>
                  <InfoIconWithModal
                    title="Mint & Stake vs Mint"
                    children={
                      <p>
                        Choose Mint & Stake to automatically stake the token to earn POP rewards. If you select Mint you
                        will not earn POP rewards unless the token is staked in the
                        <Link href="/ethereum/staking" passHref>
                          <a className="font-medium text-blue-600 hover:text-blue-900"> staking </a>
                        </Link>
                        page.
                      </p>
                    }
                  />
                </span>
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
