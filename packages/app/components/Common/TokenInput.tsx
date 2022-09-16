import { formatAndRoundBigNumber } from "@popcorn/utils";
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
    } else if (readonly) {
      setDisplayAmount(formatUnits(amount, token?.decimals));
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
    <>
      {balance && (
        <label htmlFor="tokenInput" className="font-medium text-gray-700 w-full mb-2">
          <p className="font-medium text-primary">{label}</p>
        </label>
      )}
      <div className="flex items-center gap-2 md:gap-0 md:space-x-2 w-full">
        <div className="w-full">
          <div
            className={`relative flex items-center px-5 py-4 border border-customLightGray rounded-lg ${balance && amount?.gt(balance) ? "focus:ring-red-600 border-red-600" : "focus:ring-0"
              }`}
          >
            <input
              name="tokenInput"
              id="tokenInput"
              className={`block w-full p-0 border-0 text-primaryDark text-lg focus:ring-0`}
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
            {tokenList.length > 0 ? (
              <TokenSelection
                selectedToken={token}
                tokenList={tokenList.filter((selectableToken) => selectableToken?.address !== token?.address)}
                selectToken={selectToken}
              />
            ) : (
              <div className="inline-flex items-center">
                <img className="w-5 md:mr-2 mb-0.5" src={token?.icon}></img>
                <p className="hidden md:block font-semibold text-gray-700">{token?.symbol}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {balance && amount?.gt(balance) && <p className="text-red-600">*Insufficient Balance</p>}
      <div className="flex items-center justify-between mt-2">
        {balance && (
          <div className="flex items-center">
            <img src="/images/wallet.svg" alt="3x" width="20" height="20" className="mr-2" />
            <p className="text-secondaryLight leading-6">
              {formatAndRoundBigNumber(balance, token?.decimals)}
            </p>
          </div>
        )}
        <div className="">
          {!readonly && balance && (
            <>
              <div
                className="w-9 h-6 flex items-center justify-center py-3 px-6 text-base leading-6 text-primary font-medium border border-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-all"
                role="button"
                onClick={setMaxAmount}
              >
                MAX
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
export default TokenInput;
