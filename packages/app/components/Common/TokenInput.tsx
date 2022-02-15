import { formatBigNumber, numberToBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers";
import { formatStakedAmount } from "helper/formatStakedAmount";
import { escapeRegExp, inputRegex } from "helper/inputRegex";

export interface TokenInputProps {
  label: string;
  tokenName: string;
  inputAmount: BigNumber;
  displayAmount: string;
  setDisplayAmount: (displayAmount: string) => void;
  updateInputAmount: (value: BigNumber) => void;
  maxButton?: boolean;
  balance?: BigNumber;
  readonly?: boolean;
}

const TokenInput: React.FC<TokenInputProps> = ({
  label,
  tokenName,
  inputAmount,
  balance,
  updateInputAmount,
  displayAmount,
  setDisplayAmount,
  readonly = false,
  maxButton = false,
}) => {
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === "" || inputRegex.test(escapeRegExp(nextUserInput))) {
      updateInputAmount(numberToBigNumber(Number(nextUserInput)));
      setDisplayAmount(nextUserInput);
    }
  };
  return (
    <div className="w-full">
      <span className="flex flex-col justify-between">
        <div className="">
          <div>
            <label
              htmlFor="tokenInput"
              className="flex justify-between items-center text-sm font-medium text-gray-700 text-center"
            >
              <p className="text-base font-semibold text-gray-900">{label}</p>
              {balance && (
                <p className="text-gray-500 font-medium text-sm">
                  {formatStakedAmount(balance)} {tokenName}
                </p>
              )}
            </label>
            <div className="mt-1 relative flex items-center">
              <input
                name="tokenInput"
                id="tokenInput"
                className={`block w-full pl-5 pr-16 py-3.5 border-gray-200 rounded-md font-semibold text-gray-500 focus:text-gray-800 ${
                  balance && inputAmount?.gt(balance)
                    ? "focus:ring-red-600 focus:border-red-600"
                    : "focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                value={displayAmount}
                onChange={(e) => {
                  enforcer(e.target.value.replace(/,/g, "."));
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
                readOnly={readonly}
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5 items-center">
                {maxButton && (
                  <p
                    className="inline-flex items-center text-blue-700 font-semibold border-3 border-gray-200 rounded-lg hover:bg-gray-50 px-2 h-8 leading-none cursor-pointer hover:text-indigo-500 hover:border-indigo-500 text-sm"
                    onClick={() => {
                      updateInputAmount(balance);
                      setDisplayAmount(formatBigNumber(balance));
                    }}
                  >
                    MAX
                  </p>
                )}
                <p className="inline-flex items-center font-semibold text-gray-700 mx-4">{tokenName}</p>
              </div>
            </div>
            {balance && inputAmount?.gt(balance) && <p className="text-red-600">Insufficient Balance</p>}
          </div>
        </div>
      </span>
    </div>
  );
};
export default TokenInput;
