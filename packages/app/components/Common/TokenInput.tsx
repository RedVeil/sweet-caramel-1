import { numberToBigNumber } from "@popcorn/utils";
import { Token } from "@popcorn/utils/src/types";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { formatStakedAmount } from "helper/formatAmount";
import { escapeRegExp, inputRegex } from "helper/inputRegex";
import { useEffect, useRef } from "react";

export interface TokenInputProps {
  label: string;
  token: Token;
  amount: BigNumber;
  balance?: BigNumber;
  setAmount: Function;
  readonly?: boolean;
}

export const TokenInput: React.FC<TokenInputProps> = ({
  label,
  token,
  amount,
  setAmount,
  balance,
  readonly = false,
}) => {
  const displayAmount = amount.isZero() ? "" : formatUnits(amount, token.decimals);
  const ref = useRef(displayAmount);

  useEffect(() => {
    if (displayAmount !== ref.current) {
      ref.current = ref.current.includes(".") || readonly ? displayAmount : displayAmount.split(".")[0];
    }
  }, [ref, displayAmount]);

  const onUpdate = (nextUserInput: string) => {
    if (nextUserInput === "" || inputRegex.test(escapeRegExp(nextUserInput))) {
      setAmount(numberToBigNumber(nextUserInput));
      ref.current = nextUserInput;
    }
  };

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
                  {formatStakedAmount(balance)} {token.symbol}
                </p>
              </label>
            )}
            <div className="mt-1 relative flex items-center">
              <input
                name="tokenInput"
                id="tokenInput"
                className={`block w-full pl-5 pr-16 py-3.5 border-gray-200 rounded-md font-semibold text-gray-500 focus:text-gray-800 ${
                  balance && amount?.gt(balance)
                    ? "focus:ring-red-600 focus:border-red-600"
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
                readOnly={readonly}
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5 items-center">
                {!readonly && balance && (
                  <p
                    className="inline-flex items-center text-blue-700 font-semibold border-3 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-700 px-2 h-8 pt-0.5 leading-none hover:text-blue-500 text-sm"
                    onClick={() => {
                      onUpdate(formatUnits(balance, token.decimals));
                    }}
                  >
                    MAX
                  </p>
                )}
                <p className="inline-flex items-center font-semibold text-gray-700 mx-4">{token.symbol}</p>
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
