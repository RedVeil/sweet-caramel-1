export interface TokenInputProps {
  label: string;
  tokenName: string;
  inputAmount: number;
  balance: number;
  updateInputAmount: Function;
}

const TokenInput: React.FC<TokenInputProps> = ({
  label,
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
              <p className="mb-2  text-base">{label}</p>
              <p className="text-gray-500 font-normal text-base">
                {balance} {tokenName}
              </p>
            </label>
            <div className="mt-1 relative flex items-center">
              <input
                type="number"
                name="tokenInput"
                id="tokenInput"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-16 py-4 text-lg border-gray-300 rounded-xl"
                value={String(inputAmount)}
                onChange={(e) => updateInputAmount(Number(e.target.value))}
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <kbd
                  className="inline-flex items-center border-2 border-gray-200 rounded-lg px-2 h-8 mt-2 text-sm font-sans font-medium text-gray-400 cursor-pointer hover:text-indigo-500 hover:border-indigo-500"
                  onClick={() => updateInputAmount(balance)}
                >
                  MAX
                </kbd>
                <p className="inline-flex items-center  font-medium text-lg mx-3">
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
