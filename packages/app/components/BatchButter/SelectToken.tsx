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
    <div className="relative w-16" onMouseLeave={() => setDropdown(false)}>
      <span
        className={`flex flex-row mx-auto ${
          allowSelection ? 'cursor-pointer group' : ''
        }`}
        onClick={() => setDropdown(!showDropdown)}
      >
        <p className="text-gray-700 group-hover:text-blue-700">
          {selectedToken.name}
        </p>
        {allowSelection && (
          <>
            {showDropdown ? (
              <Icon.ChevronUp className="w-5 h-6 group-hover:text-blue-700" />
            ) : (
              <Icon.ChevronDown className="w-5 h-6 group-hover:text-blue-700" />
            )}
          </>
        )}
      </span>
      {showDropdown && (
        <div className="absolute w-full h-24 bg-white shadow-md rounded-b-md z-20 top-6 flex flex-col space-y-1 px-2 pt-2">
          {Object.keys(token)
            .filter((key) => !notSelectable.includes(key))
            .map((selectableToken) => (
              <a
                key={selectableToken}
                className="cursor-pointer hover:text-blue-700"
                onClick={() => selectToken(token[selectableToken])}
              >
                {token[selectableToken].name}
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
