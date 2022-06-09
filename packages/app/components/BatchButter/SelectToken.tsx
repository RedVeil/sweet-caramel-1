import { BatchProcessTokenKey, TokenMetadata, Tokens } from "@popcorn/utils/src/types";
import { useState } from "react";
import * as Icon from "react-feather";

interface SelectTokenProps {
  allowSelection: boolean;
  options: Tokens;
  selectedToken: TokenMetadata;
  notSelectable: string[];
  selectToken?: (token: BatchProcessTokenKey) => void;
}

export default function SelectToken({
  allowSelection,
  options,
  selectedToken,
  notSelectable,
  selectToken,
}: SelectTokenProps): JSX.Element {
  const [showDropdown, setDropdown] = useState<boolean>(false);

  return (
    <div className="relative w-auto mt-1 justify-end" onMouseLeave={() => setDropdown(false)}>
      <span
        className={`flex flex-row items-center justify-end ${allowSelection ? "cursor-pointer group" : "mr-4"}`}
        onClick={() => setDropdown(allowSelection ? !showDropdown : false)}
      >
        <img className="w-5 mr-2 mb-1.5" src={`/images/tokens/${selectedToken.img}`}></img>
        <p className="font-semibold leading-none text-gray-700 group-hover:text-blue-700">{selectedToken.name}</p>

        {allowSelection && (
          <>
            {showDropdown ? (
              <Icon.ChevronUp className="w-5 h-6 mb-1 ml-2 mr-4 group-hover:text-blue-700" />
            ) : (
              <Icon.ChevronDown className="w-5 h-6 mb-1 ml-2 mr-4 group-hover:text-blue-700" />
            )}
          </>
        )}
      </span>
      {showDropdown && (
        <div className="absolute z-20 flex flex-col w-full h-28 px-2 pt-2 pb-2 space-y-1 bg-white shadow-md rounded-b-md top-6">
          {Object.keys(options)
            .filter((key) => !notSelectable.includes(key))
            .map((selectableToken) => (
              <a
                key={selectableToken}
                className="cursor-pointer group h-full flex flex-row items-center hover:bg-gray-100 rounded-md"
                onClick={() => {
                  selectToken && selectToken(options[selectableToken].key);
                  setDropdown(false);
                }}
              >
                <img className="w-5 h-5 mx-2" src={`/images/tokens/${options[selectableToken].img}`}></img>
                <p className="font-semibold group-hover:text-blue-700 mt-1.5">{options[selectableToken].name}</p>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
