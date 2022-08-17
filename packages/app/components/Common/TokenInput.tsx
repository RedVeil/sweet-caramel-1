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
    <>
      {balance && (
        <label htmlFor="tokenInput" className="flex justify-between items-center font-medium text-gray-700 w-full mb-2">
          <p className="font-medium text-primary">{label}</p>
          <p className="text-secondaryLight leading-6">
            {formatStakedAmount(balance)} {token.symbol}
          </p>
        </label>
      )}
      <div className="flex items-center gap-2 w-full">
        <div className="w-full">
          <div
            className={`relative flex items-center px-5 py-4 border border-customLightGray rounded-lg ${
              balance && amount?.gt(balance) ? "focus:ring-red-600 border-red-600" : "focus:ring-0"
            }`}
          >
            <input
              name="tokenInput"
              id="tokenInput"
              className={`block w-full p-0 border-0 text-primaryDark text-lg focus:ring-0`}
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
            <p className="inline-flex items-center font-semibold text-gray-700 mx-4">{token.symbol}</p>
          </div>
        </div>
        {!readonly && balance && (
          <div>
            <div
              className="px-5 py-4 leading-6 text-primary font-medium border border-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white text-lg transition-all"
              role="button"
              onClick={() => {
                onUpdate(formatUnits(balance, token.decimals));
              }}
            >
              MAX
            </div>
          </div>
        )}
      </div>
      {balance && amount?.gt(balance) && <p className="text-red-600">Insufficient Balance</p>}
    </>
  );
};
export default TokenInput;
