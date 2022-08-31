import { formatEther, formatUnits } from "@ethersproject/units";
import { formatAndRoundBigNumber, numberToBigNumber } from "@popcorn/utils";
import { BatchProcessTokenKey, TokenMetadata, Tokens } from "@popcorn/utils/src/types";
import { BigNumber, constants } from "ethers";
import { escapeRegExp, inputRegex } from "helper/inputRegex";
import { ButterPageState } from "pages/[network]/set/butter";
import { Dispatch, useEffect, useRef, useState } from "react";
import { CheckMarkToggleWithInfo } from "./CheckMarkToggleWithInfo";
import SelectToken from "./SelectToken";

export interface ButterTokenInputProps {
  token: Tokens;
  selectToken: (token: BatchProcessTokenKey) => void;
  depositDisabled: boolean;
  butterPageState: [ButterPageState, Dispatch<ButterPageState>];
  hasUnclaimedBalances?: boolean;
}

interface SelectedToken {
  input: TokenMetadata;
  output: TokenMetadata;
}

const ButterTokenInput: React.FC<ButterTokenInputProps> = ({
  token,
  selectToken,
  depositDisabled,
  hasUnclaimedBalances,
  butterPageState,
}) => {
  const [estimatedAmount, setEstimatedAmount] = useState<string>("");
  const [localButterPageState, setButterPageState] = butterPageState;
  const [selectedToken, setSelectedToken] = useState<SelectedToken>({
    input: localButterPageState.tokens[localButterPageState.selectedToken.input],
    output: localButterPageState.tokens[localButterPageState.selectedToken.output],
  });

  const displayInputToken = localButterPageState.isThreeX ? "USDC" : "3CRV";
  const displayOutputToken = localButterPageState.isThreeX ? "3X" : "BTR";

  const displayAmount = localButterPageState.depositAmount.isZero()
    ? ""
    : formatUnits(
      localButterPageState.depositAmount,
      localButterPageState.tokens[localButterPageState.selectedToken.input].decimals,
    );
  const ref = useRef(displayAmount);

  useEffect(() => {
    setSelectedToken({
      input: localButterPageState.tokens[localButterPageState.selectedToken.input],
      output: localButterPageState.tokens[localButterPageState.selectedToken.output],
    });
  }, [localButterPageState.selectedToken.input, localButterPageState.selectedToken.output]);

  useEffect(() => {
    if (displayAmount !== ref.current) {
      ref.current = ref.current.includes(".") ? displayAmount : displayAmount.split(".")[0];
    }
  }, [ref, displayAmount]);

  const onUpdate = (nextUserInput: string) => {
    if (nextUserInput === "" || inputRegex.test(escapeRegExp(nextUserInput))) {
      setButterPageState({
        ...localButterPageState,
        depositAmount: numberToBigNumber(
          nextUserInput,
          localButterPageState.tokens[localButterPageState.selectedToken.input].decimals,
        ),
      });
      ref.current = nextUserInput;
    }
  };

  useEffect(() => {
    if (localButterPageState.depositAmount.eq(constants.Zero)) {
      setEstimatedAmount("");
    } else {
      calcOutputAmountsFromInput(localButterPageState.depositAmount);
    }
  }, [localButterPageState.depositAmount]);

  function calcOutputAmountsFromInput(value: BigNumber): void {
    setEstimatedAmount(
      formatAndRoundBigNumber(
        value.mul(selectedToken.input.price).div(selectedToken.output.price),
        18,
      ),
    )
  }

  const useUnclaimedDepositsisDisabled = (): boolean => {
    const keys = localButterPageState.isThreeX ? ["usdc", "threeX"] : ["threeCrv", "butter"];
    return !keys.includes(localButterPageState.selectedToken.input);
  };

  return (
    <>
      <div className="mt-10">
        <div className="flex flex-row items-center justify-between mb-2">
          <p className="text-base font-medium text-primary">
            {localButterPageState.redeeming ? "Redeem Amount" : "Deposit Amount"}
          </p>
          <p className="text-secondaryLight">
            {`${formatAndRoundBigNumber(
              localButterPageState.useUnclaimedDeposits
                ? selectedToken.input.claimableBalance
                : selectedToken.input.balance,
              selectedToken.input.decimals,
            )} ${selectedToken.input.name}`}
          </p>
        </div>
        <div>
          <div className="mt-1 relative flex items-center gap-2">
            <div
              className={`w-full flex px-5 py-4 items-center rounded-lg border ${localButterPageState.depositAmount.gt(
                localButterPageState.useUnclaimedDeposits
                  ? selectedToken.input.claimableBalance
                  : selectedToken.input.balance,
              )
                ? " border-customRed"
                : "border-customLightGray "
                }`}
            >
              <input
                name="tokenInput"
                id="tokenInput"
                className={`block w-full p-0 border-0 text-primaryDark text-lg`}
                onChange={(e) => {
                  onUpdate(e.target.value.replace(/,/g, "."));
                }}
                value={ref.current}
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                // text-specific options
                type="text"
                pattern="^[0-9]*[.,]?[0-9]*$"
                placeholder={"0.0"}
                minLength={1}
                maxLength={79}
                spellCheck="false"
              />
              <SelectToken
                allowSelection={!localButterPageState.redeeming}
                selectedToken={selectedToken.input}
                options={token}
                notSelectable={[
                  localButterPageState.selectedToken.input,
                  ...(localButterPageState.redeeming ? ["threeCrv", "usdc"] : ["butter", "threeX"]),
                ]}
                selectToken={selectToken}
              />
            </div>
            <button
              className="px-5 py-4 leading-6 text-primary font-medium border border-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white text-lg transition-all"
              onClick={(e) => {
                const maxAmount = localButterPageState.useUnclaimedDeposits
                  ? selectedToken.input.claimableBalance
                  : selectedToken.input.balance;
                calcOutputAmountsFromInput(maxAmount);
                setButterPageState({ ...localButterPageState, depositAmount: maxAmount });
                ref.current = Number(formatEther(maxAmount)).toFixed(3);
              }}
            >
              MAX
            </button>
          </div>
        </div>

        {hasUnclaimedBalances && !localButterPageState.instant && (
          <CheckMarkToggleWithInfo
            disabled={useUnclaimedDepositsisDisabled()}
            value={Boolean(localButterPageState.useUnclaimedDeposits)}
            onChange={(e) => {
              setEstimatedAmount("0");
              setButterPageState({
                ...localButterPageState,
                depositAmount: constants.Zero,
                useUnclaimedDeposits: !localButterPageState.useUnclaimedDeposits,
              });
            }}
            infoTitle="About Unclaimed Balances"
            infoText={`When a batch is minted but the ${displayOutputToken} has not been claimed yet, it can be redeemed without having to claim it first. By checking “use unclaimed balances” you will be able to redeem unclaimed balances of ${displayOutputToken}. This process applies also for unclaimed ${displayInputToken}, which can be converted to ${displayOutputToken} without having to claim it.`}
            label="Use only unclaimed balances"
          />
        )}

        {localButterPageState.depositAmount.gt(
          localButterPageState.useUnclaimedDeposits
            ? selectedToken.input.claimableBalance
            : selectedToken.input.balance,
        ) && <p className="text-customRed pt-2 leading-6">*Insufficient balance</p>}
      </div>
      <div className="relative -mt-10 -mb-10">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-customLightGray" />
        </div>
        <div className={`relative flex justify-center ${depositDisabled ? "mb-16 mt-10" : "my-16"}`}>
          <div className="w-20 bg-white">
            <div
              className="flex items-center w-14 h-14 mx-auto border border-customLightGray rounded-full cursor-pointer"
              onClick={(e) =>
                setButterPageState({
                  ...localButterPageState,
                  redeeming: !localButterPageState.redeeming,
                })
              }
            >
              <img src="/images/icons/exchangeIcon.svg" alt="exchangeIcon" className="p-3 mx-auto"></img>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-base font-medium text-primary">{`Estimated ${selectedToken.output.name} Amount`}</p>
        <div>
          <div className="mt-1 flex items-center px-5 py-4 border border-customLightGray rounded-md relative">
            <input
              className={`block w-full p-0 border-0 text-primaryDark text-lg outline-none focus:bg-transparent focus:ring-0`}
              value={estimatedAmount}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              // text-specific options
              type="text"
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder={"0.0"}
              minLength={1}
              maxLength={79}
              spellCheck="false"
              readOnly
            />
            <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5 items-center">
              <SelectToken
                allowSelection={localButterPageState.redeeming && localButterPageState.instant}
                selectedToken={selectedToken.output}
                options={token}
                notSelectable={[localButterPageState.selectedToken.output, "butter", "threeX"]}
                selectToken={selectToken}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default ButterTokenInput;
