import { formatAndRoundBigNumber, numberToBigNumber } from "@popcorn/utils";
import { Token } from "@popcorn/utils/src/types";
import TokenSelection from "components/SweetVaults/TokenSelection";
import { BigNumber, constants } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { escapeRegExp, inputRegex } from "helper/inputRegex";
import { useEffect, useState } from "react";

export interface TokenInputProps {
  label: string;
  token: Token;
  amount: BigNumber;
  setAmount: Function;
  balance?: BigNumber;
  readonly?: boolean;
  tokenList?: Token[];
  selectToken?: any;
}

export const TokenInput: React.FC<TokenInputProps> = ({
  label,
  token,
  setAmount,
  amount,
  balance,
  readonly = false,
  tokenList = [],
  selectToken = null,
}) => {
  const [displayAmount, setDisplayAmount] = useState<string>(
    amount.isZero() ? "" : formatUnits(amount, token?.decimals),
  );

  useEffect(() => {
    if (amount.isZero()) {
      setDisplayAmount("");
    }
  }, [amount]);

  const onUpdate = (nextUserInput: string) => {
    if (inputRegex.test(escapeRegExp(nextUserInput))) {
      const newAmount = ["", "."].includes(nextUserInput) ? constants.Zero : parseUnits(nextUserInput, token?.decimals);
      setDisplayAmount(nextUserInput);
      if (!amount.eq(newAmount)) {
        setAmount(newAmount);
      }
    }
  };

  function setMaxAmount() {
    setDisplayAmount(formatUnits(balance, token?.decimals));
    setAmount(balance);
  }

  return (
    <div className="w-full">
      <span className="flex flex-col justify-between">
        <div className="">
          <div>
            {balance && (
              <label
                htmlFor="tokenInput"
                className="flex justify-between items-center text-sm font-medium text-gray-700 text-center"
              >
                <p className="text-base font-semibold text-gray-900">{label}</p>
                <p className="text-gray-500 font-medium text-sm">
                  {formatAndRoundBigNumber(balance, token?.decimals)} {token?.symbol}
                </p>
              </label>
            )}
            <div className="mt-1 relative flex items-center">
              <input
                name="tokenInput"
                id="tokenInput"
                className={`block w-full pl-5 py-3.5 border-gray-200 rounded-md font-semibold text-gray-500 focus:text-gray-800 ${selectToken ? "pr-40 md:pr-52" : "pr-32 md:pr-36"
                  } ${balance && amount?.gt(balance)
                    ? "focus:ring-red-600 focus:border-red-600"
                    : "focus:ring-blue-500 focus:border-blue-500"
                  }`}
                onChange={(e) => {
                  onUpdate(e.target.value.replace(/,/g, "."));
                }}
                value={displayAmount}
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
                readOnly={readonly}
              />
              <div className={`absolute inset-y-0 right-0 flex items-center py-1.5 ${selectToken ? "" : "pr-3"}`}>
                {!readonly && balance && (
                  <>
                    <p
                      className="inline-flex items-center text-blue-700 font-semibold border-3 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-700 px-2 h-8 pt-0.5 leading-none hover:text-blue-500 text-sm"
                      onClick={setMaxAmount}
                    >
                      MAX
                    </p>
                    {tokenList.length > 0 && (
                      <TokenSelection
                        selectedToken={token}
                        tokenList={tokenList.filter((selectableToken) => selectableToken?.address !== token?.address)}
                        selectToken={selectToken}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
            {balance && amount?.gt(balance) && <p className="text-red-600">Insufficient Balance</p>}
          </div>
        </div>
      </span>
    </div>
  );
};
export default TokenInput;
