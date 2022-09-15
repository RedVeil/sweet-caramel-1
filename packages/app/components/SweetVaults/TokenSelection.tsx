import { Token } from "@popcorn/utils/src/types";
import Image from "next/image";
import { useState } from "react";
import * as Icon from "react-feather";

interface TokenSelectionProps {
  tokenList: Token[];
  selectedToken: Token;
  selectToken?: Function;
}

export default function TokenSelection({ tokenList, selectedToken, selectToken }: TokenSelectionProps): JSX.Element {
  const [showDropdown, setDropdown] = useState<boolean>(false);

  return (
    <div className="relative w-full ml-2 justify-end" onMouseLeave={() => setDropdown(false)}>
      <span
        className={`flex flex-row items-center justify-end`}
        onClick={() => (selectToken ? setDropdown(!showDropdown) : {})}
      >
        <img className="w-5 mr-1" src={selectedToken?.icon}></img>
        <p className="font-semibold leading-none mt-0.5 text-gray-700 group-hover:text-blue-700 hidden md:block">{selectedToken?.symbol}</p>
        {
          //TODO potentially make this an explicit flag
          selectToken && (
            <>
              {showDropdown ? (
                <Icon.ChevronUp className="w-5 h-5 ml-1 mb-0.5 group-hover:text-blue-700" />
              ) : (
                <Icon.ChevronDown className="w-5 h-5 ml-1 mb-0.5 group-hover:text-blue-700" />
              )}
            </>
          )
        }
      </span>
      {showDropdown && (
        <div className="absolute right-0.5 z-20 top-6">
          <div className="flex flex-col w-40 h-full px-2 pt-2 pb-2 space-y-1 bg-white shadow-md rounded-md">
            {tokenList.map((selectableToken) => (
              <a
                key={selectableToken?.name}
                className="cursor-pointer group h-full flex flex-row items-center hover:bg-gray-100 rounded-md"
                onClick={() => {
                  selectToken(selectableToken);
                  setDropdown(false);
                }}
              >
                {selectableToken?.icon && <Image src={selectableToken?.icon} priority={true} width="20" height="20" />}
                <p className="font-semibold group-hover:text-blue-700 mt-1.5 ml-2">{selectableToken?.name}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
