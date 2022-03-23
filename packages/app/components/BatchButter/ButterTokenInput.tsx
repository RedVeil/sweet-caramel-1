import { formatEther, formatUnits } from "@ethersproject/units";
import { formatAndRoundBigNumber, formatBigNumber, numberToBigNumber } from "@popcorn/utils";
import { BatchProcessTokenKey, BatchProcessTokens } from "@popcorn/utils/src/types";
import { InfoIconWithModal } from "components/InfoIconWithModal";
import { BigNumber } from "ethers";
import { escapeRegExp, inputRegex } from "helper/inputRegex";
import { ButterPageState } from "pages/butter";
import { Dispatch, useEffect, useRef, useState } from "react";
import SelectToken from "./SelectToken";

export interface ButterTokenInputProps {
  token: BatchProcessTokens;
  selectToken: (token: BatchProcessTokenKey) => void;
  depositDisabled: boolean;
  hasUnclaimedBalances: boolean;
  butterPageState: [ButterPageState, Dispatch<ButterPageState>];
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

  const displayAmount = localButterPageState.depositAmount.isZero()
    ? ""
    : Number(
        formatUnits(
          localButterPageState.depositAmount,
          localButterPageState.token[localButterPageState.selectedToken.input].decimals,
        ),
      ).toFixed(3);
  const ref = useRef(displayAmount);

  useEffect(() => {
    if (displayAmount !== ref.current) {
      ref.current = ref.current.includes(".") ? displayAmount : displayAmount.split(".")[0];
    }
  }, [ref, displayAmount]);

  const onUpdate = (nextUserInput: string) => {
    if (nextUserInput === "" || inputRegex.test(escapeRegExp(nextUserInput))) {
      setButterPageState({ ...localButterPageState, depositAmount: numberToBigNumber(Number(nextUserInput)) });
      ref.current = nextUserInput;
    }
  };

  useEffect(() => {
    if (localButterPageState.depositAmount.eq(BigNumber.from("0"))) {
      setEstimatedAmount("");
    } else {
      calcOutputAmountsFromInput(localButterPageState.depositAmount);
    }
  }, [localButterPageState.depositAmount]);

  function calcOutputAmountsFromInput(value: BigNumber): void {
    setEstimatedAmount(
      String(
        formatBigNumber(
          value
            .mul(localButterPageState.token[localButterPageState.selectedToken.input].price)
            .div(localButterPageState.token[localButterPageState.selectedToken.output].price),
        ),
      ),
    );
  }

  return (
    <>
      <div className="mt-10">
        <div className="flex flex-row items-center justify-between mb-1">
          <p className="text-base font-semibold text-gray-900">Deposit Amount</p>
          <p className="text-gray-500 font-medium text-sm">
            {`${formatAndRoundBigNumber(
              localButterPageState.useUnclaimedDeposits
                ? localButterPageState.token[localButterPageState.selectedToken.input].claimableBalance
                : localButterPageState.token[localButterPageState.selectedToken.input].balance,
              localButterPageState.redeeming ? 6 : 2,
              localButterPageState.token[localButterPageState.selectedToken.input].decimals,
            )} ${localButterPageState.token[localButterPageState.selectedToken.input].name}`}
          </p>
        </div>
        <div>
          <div className="mt-1 relative flex items-center">
            <input
              name="tokenInput"
              id="tokenInput"
              className={`block w-full pl-5 pr-16 py-3.5 border-gray-200 rounded-md font-semibold text-gray-500 focus:text-gray-800 ${
                localButterPageState.depositAmount.gt(
                  localButterPageState.useUnclaimedDeposits
                    ? localButterPageState.token[localButterPageState.selectedToken.input].claimableBalance
                    : localButterPageState.token[localButterPageState.selectedToken.input].balance,
                )
                  ? "focus:ring-red-600 border-red-600"
                  : "focus:ring-blue-500 focus:border-blue-500"
              }`}
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
            <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5 items-center">
              <p
                className="px-2 pb-1 pt-1.5 mr-4 leading-none text-blue-700 font-semibold border-3 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-700 text-sm"
                onClick={(e) => {
                  const maxAmount = localButterPageState.useUnclaimedDeposits
                    ? localButterPageState.token[localButterPageState.selectedToken.input].claimableBalance
                    : localButterPageState.token[localButterPageState.selectedToken.input].balance;
                  calcOutputAmountsFromInput(maxAmount);
                  setButterPageState({ ...localButterPageState, depositAmount: maxAmount });
                  ref.current = Number(formatEther(maxAmount)).toFixed(3);
                }}
              >
                MAX
              </p>
              <SelectToken
                allowSelection={!localButterPageState.redeeming}
                selectedToken={localButterPageState.token[localButterPageState.selectedToken.input]}
                token={token}
                notSelectable={[
                  localButterPageState.selectedToken.input,
                  localButterPageState.redeeming ? "threeCrv" : "butter",
                ]}
                selectToken={selectToken}
              />
            </div>
          </div>
        </div>

        {hasUnclaimedBalances && (
          <div className="flex flex-row items-center mt-2">
            <label
              className={`flex flex-row items-center  group ${
                ["threeCrv", "butter"].includes(localButterPageState.selectedToken.input)
                  ? "cursor-pointer"
                  : "cursor-default"
              }`}
            >
              <input
                type="checkbox"
                className="mr-2 rounded-sm"
                checked={Boolean(localButterPageState.useUnclaimedDeposits)}
                onChange={(e) => {
                  setEstimatedAmount("0");
                  setButterPageState({
                    ...localButterPageState,
                    depositAmount: BigNumber.from("0"),
                    useUnclaimedDeposits: !localButterPageState.useUnclaimedDeposits,
                  });
                }}
                disabled={!["threeCrv", "butter"].includes(localButterPageState.selectedToken.input)}
              />
              <p
                className={`text-base mt-0.5 leading-none ${
                  ["threeCrv", "butter"].includes(localButterPageState.selectedToken.input)
                    ? "text-gray-600 group-hover:text-blue-700"
                    : "text-gray-400"
                }`}
              >
                Use only unclaimed balances
              </p>
            </label>
            <div className="mb-1">
              <InfoIconWithModal title="About Unclaimed Balances">
                <p>
                  When a batch is minted but the Butter has not been claimed yet, it can be redeemed without having to
                  claim it first. By checking “use unclaimed balances” you will be able to redeem unclaimed balances of
                  Butter. This process applies also for unclaimed 3CRV, which can be converted to Butter without having
                  to claim it.
                </p>
              </InfoIconWithModal>
            </div>
          </div>
        )}

        {localButterPageState.depositAmount.gt(
          localButterPageState.useUnclaimedDeposits
            ? localButterPageState.token[localButterPageState.selectedToken.input].claimableBalance
            : localButterPageState.token[localButterPageState.selectedToken.input].balance,
        ) && <p className="text-red-600">Insufficient Balance</p>}
      </div>
      <div className="relative -mt-10 -mb-10">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className={`relative flex justify-center ${depositDisabled ? "mb-16 mt-10" : "my-16"}`}>
          <div className="w-20 bg-white">
            <div
              className="flex items-center w-14 h-14 mx-auto border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 hover:border-gray-400"
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
        <p className="text-base font-semibold text-gray-900">{`Estimated ${
          localButterPageState.token[localButterPageState.selectedToken.output].name
        } Amount`}</p>
        <div>
          <div className="mt-1 relative flex items-center">
            <input
              className={`block w-full pl-5 pr-16 py-3.5 border-gray-200 rounded-md font-semibold text-gray-500 focus:text-gray-800 focus:ring-blue-500 focus:border-blue-500`}
              value={Number(estimatedAmount).toFixed(3)}
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
                allowSelection={false}
                selectedToken={localButterPageState.token[localButterPageState.selectedToken.output]}
                token={token}
                notSelectable={[
                  localButterPageState.selectedToken.output,
                  localButterPageState.redeeming ? "butter" : "threeCrv",
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default ButterTokenInput;
