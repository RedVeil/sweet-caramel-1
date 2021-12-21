import { BatchProcessTokens } from 'pages/butter';
import { useState } from 'react';
import * as Icon from 'react-feather';
import { BatchProcessToken } from './TokenInput';

interface SelectTokenProps {
  allowSelection: Boolean;
  token: BatchProcessTokens;
  selectedToken: BatchProcessToken;
  notSelectable: string[];
  selectToken: Function;
}

export default function SelectToken({
  allowSelection,
  token,
  selectedToken,
  notSelectable,
  selectToken,
}: SelectTokenProps): JSX.Element {
  const [showDropdown, setDropdown] = useState<Boolean>(false);

  return (
    <div
      className="relative w-24 mt-1 "
      onMouseLeave={() => setDropdown(false)}
    >
      <span
        className={`flex flex-row mx-auto items-center ${
          allowSelection ? 'cursor-pointer group' : ''
        }`}
        onClick={() => setDropdown(allowSelection ? !showDropdown : false)}
      >
        <img
          className="w-4 h-4 mx-2 mb-1"
          src={`images/tokens/${selectedToken.img}`}
        ></img>
        <p className="font-semibold leading-none text-gray-700 group-hover:text-blue-700">
          {selectedToken.name}
        </p>

        {allowSelection && (
          <>
            {showDropdown ? (
              <Icon.ChevronUp className="w-5 h-6 mb-1 group-hover:text-blue-700" />
            ) : (
              <Icon.ChevronDown className="w-5 h-6 mb-1 group-hover:text-blue-700" />
            )}
          </>
        )}
      </span>
      {showDropdown && (
        <div className="absolute z-20 flex flex-col w-full h-24 px-2 pt-2 space-y-1 bg-white shadow-md rounded-b-md top-6">
          {Object.keys(token)
            .filter((key) => !notSelectable.includes(key))
            .map((selectableToken) => (
              <a
                key={selectableToken}
                className="cursor-pointer group flex flex-row items-center"
                onClick={() => selectToken(token[selectableToken])}
              >
                <img
                  className="w-4 h-4 mx-2 mb-1"
                  src={`images/tokens/${token[selectableToken].img}`}
                ></img>
                <p className="font-semibold group-hover:text-blue-700">
                  {token[selectableToken].name}
                </p>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
