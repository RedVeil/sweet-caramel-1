import { InfoIconWithModal } from "components/InfoIconWithModal";
import { BigNumber } from "ethers";
import { escapeRegExp, inputRegex } from "helper/inputRegex";
import { BatchProcessTokens, SelectedToken } from "pages/butter";
import { Dispatch, useEffect, useState } from "react";
import { formatAndRoundBigNumber, formatBigNumber, scaleNumberToBigNumber } from "../../../utils";
import SelectToken from "./SelectToken";

export interface BatchProcessToken {
  name: string;
  key: string;
  balance: BigNumber;
  allowance: BigNumber;
  claimableBalance?: BigNumber;
  price: BigNumber;
  decimals: number;
  img?: string;
}

export interface TokenInputProps {
  token: BatchProcessTokens;
  selectedToken: SelectedToken;
  selectToken: Function;
  redeeming: Boolean;
  setRedeeming: Dispatch<Boolean>;
  depositAmount: BigNumber;
  setDepositAmount: Dispatch<BigNumber>;
  useUnclaimedDeposits: Boolean;
  setUseUnclaimedDeposits: Dispatch<Boolean>;
  depositDisabled: boolean;
  hasUnclaimedBalances: boolean;
}

const TokenInput: React.FC<TokenInputProps> = ({
  token,
  selectedToken,
  selectToken,
  redeeming,
  setRedeeming,
  depositAmount,
  setDepositAmount,
  useUnclaimedDeposits,
  setUseUnclaimedDeposits,
  depositDisabled,
  hasUnclaimedBalances,
}) => {
  const [estimatedAmount, setEstimatedAmount] = useState<string>("");
  const [displayDepositAmount, setDisplayDepositAmount] = useState<string>("");

  useEffect(() => {
    if (depositAmount.eq(BigNumber.from("0"))) {
      setDisplayDepositAmount("");
      setEstimatedAmount("");
    } else {
      setDisplayDepositAmount(String(formatBigNumber(depositAmount)));
      calcOutputAmountsFromInput(depositAmount);
    }
  }, [depositAmount]);

  function updateWithOuputAmounts(value: string): void {
    if (value !== ".") {
      const newDepositAmount = scaleNumberToBigNumber(Number(value))
        .mul(selectedToken.output.price)
        .div(selectedToken.input.price);
      setDepositAmount(newDepositAmount);
    } else {
      setDisplayDepositAmount("0");
    }
    setEstimatedAmount(value);
  }

  function updateWithInputAmounts(value: string): void {
    if (!["0.", "."].includes(value)) {
      const raisedValue = scaleNumberToBigNumber(Number(value));
      setDepositAmount(raisedValue);
    } else {
      setDisplayDepositAmount(value);
    }
  }

  function calcOutputAmountsFromInput(value: BigNumber): void {
    setEstimatedAmount(String(formatBigNumber(value.mul(selectedToken.input.price).div(selectedToken.output.price))));
  }

  const enforcer = (nextUserInput: string, useOutput: boolean) => {
    if (nextUserInput === "" || inputRegex.test(escapeRegExp(nextUserInput))) {
      if (useOutput) {
        updateWithOuputAmounts(nextUserInput);
      } else {
        updateWithInputAmounts(nextUserInput);
      }
    }
  };

  return (
    <>
      <div className="mt-10">
        <div className="flex flex-row items-center justify-between mb-1">
          <p className="text-base font-semibold text-gray-900">Deposit Amount</p>
          <p className="text-gray-500 font-medium text-sm">
            {`${formatAndRoundBigNumber(
              useUnclaimedDeposits ? selectedToken.input.claimableBalance : selectedToken.input.balance,
              1,
              selectedToken.input.decimals,
            )} ${selectedToken.input.name}`}
          </p>
        </div>
        <div>
          <div className="mt-1 relative flex items-center">
            <input
              className={`block w-full pl-5 pr-16 py-3.5 border-gray-200 rounded-md font-semibold text-gray-500 focus:text-gray-800 ${
                depositAmount.gt(
                  useUnclaimedDeposits ? selectedToken.input.claimableBalance : selectedToken.input.balance,
                )
                  ? "focus:ring-red-600 focus:border-red-600"
                  : "focus:ring-indigo-500 focus:border-indigo-500"
              }`}
              value={displayDepositAmount}
              onChange={(e) => {
                enforcer(e.target.value.replace(/,/g, "."), false);
              }}
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
                  const maxAmount = useUnclaimedDeposits
                    ? selectedToken.input.claimableBalance
                    : selectedToken.input.balance;
                  setDepositAmount(maxAmount);
                  setDisplayDepositAmount(String(formatBigNumber(maxAmount)));
                  calcOutputAmountsFromInput(maxAmount);
                }}
              >
                MAX
              </p>
              <SelectToken
                allowSelection={!redeeming}
                selectedToken={selectedToken.input}
                token={token}
                notSelectable={[selectedToken.input.key, redeeming ? "threeCrv" : "butter"]}
                selectToken={selectToken}
              />
            </div>
          </div>
        </div>

        {hasUnclaimedBalances && (
          <div className="flex flex-row items-center mt-2">
            <label
              className={`flex flex-row items-center  group ${
                ["threeCrv", "butter"].includes(selectedToken.input.key) ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <input
                type="checkbox"
                className="mr-2 rounded-sm"
                checked={Boolean(useUnclaimedDeposits)}
                onChange={(e) => {
                  setUseUnclaimedDeposits(!useUnclaimedDeposits);
                  setDisplayDepositAmount("");
                  setDepositAmount(BigNumber.from("0"));
                  setEstimatedAmount("0");
                }}
                disabled={!["threeCrv", "butter"].includes(selectedToken.input.key)}
              />
              <p
                className={`text-base mt-0.5 leading-none ${
                  ["threeCrv", "butter"].includes(selectedToken.input.key)
                    ? "text-gray-600 group-hover:text-blue-700"
                    : "text-gray-400"
                }`}
              >
                Use only unclaimed balances
              </p>
            </label>
            <div className="mt-1">
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

        {depositAmount.gt(
          useUnclaimedDeposits ? selectedToken.input.claimableBalance : selectedToken.input.balance,
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
              onClick={(e) => setRedeeming(!redeeming)}
            >
              <img src="/images/icons/exchangeIcon.svg" alt="exchangeIcon" className="p-3 mx-auto"></img>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-base font-semibold text-gray-900">{`Estimated ${selectedToken.output.name} Amount`}</p>
        <div>
          <div className="mt-1 relative flex items-center">
            <input
              className="block w-full pl-5 pr-16 py-3.5 border-gray-200 rounded-md font-semibold text-gray-500 focus:text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
              value={estimatedAmount}
              onChange={(e) => enforcer(e.target.value.replace(/,/g, "."), true)}
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
              <SelectToken
                allowSelection={false}
                selectedToken={selectedToken.output}
                token={token}
                notSelectable={[selectedToken.output.key, redeeming ? "butter" : "threeCrv"]}
                selectToken={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default TokenInput;
