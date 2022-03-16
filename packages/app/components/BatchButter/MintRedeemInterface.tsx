import { BatchType } from "@popcorn/utils/src/types";
import { BigNumber, ethers } from "ethers";
import MainActionButton from "../MainActionButton";
import ButterTokenInput, { ButterTokenInputProps } from "./ButterTokenInput";
import MintRedeemToggle from "./MintRedeemToggle";
import SlippageSettings from "./SlippageSettings";
interface MintRedeemInterfaceProps extends ButterTokenInputProps {
  deposit: (depositAmount: BigNumber, batchType: BatchType) => Promise<void>;
  approve: (contractKey: string) => Promise<void>;
  hasUnclaimedBalances: boolean;
}

const MintRedeemInterface: React.FC<MintRedeemInterfaceProps> = ({
  token,
  selectToken,
  deposit,
  approve,
  depositDisabled,
  hasUnclaimedBalances,
  butterPageState,
}) => {
  const [localButterPageState, setButterPageState] = butterPageState;
  function setRedeeming(redeeming: boolean) {
    setButterPageState({ ...localButterPageState, redeeming: redeeming });
  }
  function setSlippage(slippage: number) {
    setButterPageState({ ...localButterPageState, slippage: slippage });
  }
  return (
    <div className="bg-white rounded-3xl px-5 pt-6 pb-6 md:mr-8 border border-gray-200 shadow-custom">
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
      <div className="w-full pb-16">
        {!localButterPageState.redeeming && localButterPageState.selectedToken.input.key !== "threeCrv" && (
          <SlippageSettings slippage={localButterPageState.slippage} setSlippage={setSlippage} />
        )}
      </div>
      {!depositDisabled &&
        !localButterPageState.redeeming &&
        localButterPageState.selectedToken.input.key !== "threeCrv" && (
          <div className="pb-6">
            <div className="flex flex-row justify-between">
              <p className="text-base leading-none mt-0.5 ml-2t text-gray-500">Slippage</p>
              <p className="text-base font-semibold leading-none mt-0.5 ml-2t text-gray-500">
                {localButterPageState.slippage} %
              </p>
            </div>
          </div>
        )}
      <div className="w-full text-center">
        {hasUnclaimedBalances && localButterPageState.useUnclaimedDeposits ? (
          <div className="pt-6">
            <MainActionButton
              label={localButterPageState.redeeming ? "Redeem" : "Mint"}
              handleClick={(e) =>
                deposit(
                  localButterPageState.depositAmount,
                  localButterPageState.redeeming ? BatchType.Redeem : BatchType.Mint,
                )
              }
              disabled={depositDisabled}
            />
          </div>
        ) : (
          <>
            {localButterPageState.depositAmount.gt(localButterPageState.selectedToken.input.allowance) ||
            localButterPageState.selectedToken.input.allowance.eq(ethers.constants.Zero) ? (
              <div className="space-y-4">
                <MainActionButton
                  label={`Allow Popcorn to use your ${localButterPageState.selectedToken.input.name}`}
                  handleClick={(e) => approve(localButterPageState.selectedToken.input.key)}
                  disabled={localButterPageState.depositAmount.eq(BigNumber.from("0"))}
                />
                <MainActionButton
                  label={localButterPageState.redeeming ? "Redeem" : "Mint"}
                  handleClick={(e) =>
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
                  handleClick={(e) =>
                    deposit(
                      localButterPageState.depositAmount,
                      localButterPageState.redeeming ? BatchType.Redeem : BatchType.Mint,
                    )
                  }
                  disabled={depositDisabled}
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
