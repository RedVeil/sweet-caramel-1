export interface TokenInputProps {
  tokenName: string;
  inputAmount: number;
  balance: number;
  updateInputAmount: Function;
}

const TokenInput: React.FC<TokenInputProps> = ({
  tokenName,
  inputAmount,
  balance,
  updateInputAmount,
}) => {
  return (
    <div className="w-full">
      <span className="flex flex-col justify-between">
        <div className="">
          <div>
            <label
              htmlFor="tokenInput"
              className="flex justify-between text-sm font-medium text-gray-700 text-center"
            >
              <p>Stake Amount</p>
              <p className="text-gray-500 font-normal">
                {balance} {tokenName}
              </p>
            </label>
            <div className="mt-1 relative flex items-center">
              <input
                type="text"
                name="tokenInput"
                id="tokenInput"
                className="shadow-sm bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 py-5 sm:text-sm border-gray-300 rounded-md"
                value={String(inputAmount)}
                onChange={(e) => updateInputAmount(Number(e.target.value))}
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <kbd
                  className="inline-flex items-center border border-gray-200 rounded px-2 text-sm font-sans font-medium text-gray-400 cursor-pointer hover:text-indigo-500 hover:border-indigo-500"
                  onClick={() => updateInputAmount(balance)}
                >
                  MAX
                </kbd>
                <p className="inline-flex items-center text-gray-600 font-light text-xl mx-2">
                  {tokenName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </span>
    </div>
  );
};
export default TokenInput;
