import { escapeRegExp, inputRegex } from 'helper/inputRegex';
import { useEffect, useState } from 'react';

export interface TokenInputProps {
  label: string;
  tokenName: string;
  inputAmount: number;
  balance: number;
  updateInputAmount: Function;
}

const TokenInput: React.FC<TokenInputProps> = ({ label, tokenName, inputAmount, balance, updateInputAmount }) => {
  const [displayAmount, setDisplayAmount] = useState<string>('');

  useEffect(() => {
    if (inputAmount === undefined) {
      setDisplayAmount('');
    } else {
      setDisplayAmount(String(inputAmount));
    }
  }, [inputAmount]);

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '') {
      updateInputAmount(undefined);
    } else if (inputRegex.test(escapeRegExp(nextUserInput))) {
      console.log(nextUserInput);
      if (!['0.', '.'].includes(nextUserInput)) {
        updateInputAmount(Number(nextUserInput));
      } else {
        setDisplayAmount(nextUserInput);
      }
    }
  };
  return (
    <div className="w-full">
      <span className="flex flex-col justify-between">
        <div className="">
          <div>
            <label htmlFor="tokenInput" className="flex justify-between text-sm font-medium text-gray-700 text-center">
              <p className="mb-2  text-base">{label}</p>
              <p className="text-gray-500 font-normal text-base">
                {balance} {tokenName}
              </p>
            </label>
            <div className="mt-1 relative flex items-center">
              <input
                name="tokenInput"
                id="tokenInput"
                className={`shadow-sm  block w-full pl-4 pr-16 py-4 text-lg border-gray-300 rounded-xl ${
                  inputAmount > balance
                    ? 'focus:ring-red-600 focus:border-red-600'
                    : 'focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                value={displayAmount}
                onChange={(e) => {
                  enforcer(e.target.value.replace(/,/g, '.'));
                }}
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                // text-specific options
                type="text"
                pattern="^[0-9]*[.,]?[0-9]*$"
                placeholder={'0.0'}
                minLength={1}
                maxLength={79}
                spellCheck="false"
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <kbd
                  className="inline-flex items-center border-2 border-gray-200 rounded-lg px-2 h-8 mt-2 text-sm font-sans font-medium text-blue-600 cursor-pointer hover:text-indigo-500 hover:border-indigo-500"
                  onClick={() => {
                    updateInputAmount(balance);
                    setDisplayAmount(String(balance));
                  }}
                >
                  MAX
                </kbd>
                <p className="inline-flex items-center  font-medium text-lg mx-3">{tokenName}</p>
              </div>
            </div>
            {inputAmount > balance && <p className="text-red-600">Insufficient Balance</p>}
          </div>
        </div>
      </span>
    </div>
  );
};
export default TokenInput;
