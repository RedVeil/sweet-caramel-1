import { FC, Dispatch, useState, SetStateAction, useEffect, useRef } from "react"
import { SearchIcon } from "@heroicons/react/outline";
import Image from "next/image";
import { BatchProcessTokenKey, TokenMetadata, Tokens } from "@popcorn/utils/src/types";

interface SearchTokenProps {
  options: Tokens;
  selectedToken: TokenMetadata;
  notSelectable: string[];
  selectToken: Dispatch<SetStateAction<BatchProcessTokenKey>>;
  setShowSelectTokenModal: Dispatch<SetStateAction<boolean>>;
}

export const SearchToken: FC<SearchTokenProps> = ({
  notSelectable,
  options,
  selectToken,
  setShowSelectTokenModal,
  selectedToken,
}) => {
  const quickOptionsTokens = ["dai", "usdt", "usdc", "eth", "wbtc"];
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

  const formatTokens = () => {
    const tokens = Object.keys(options).filter((token) => !notSelectable.includes(token));
    setFilteredOptions([selectedToken.key, ...tokens]);
  };

  useEffect(() => {
    formatTokens();
  }, [options, notSelectable, selectedToken])

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const newNonSelectable = notSelectable.filter((token) => token !== selectedToken.key);
    if (value.trim().length > 0) {
      const filtered = Object.keys(options).filter((token) => {
        const tokenName = options[token].name.toLowerCase();
        const searchValue = value.toString().toLowerCase();
        return tokenName.includes(searchValue);
      });
      const newOptions = Object.keys(options).filter(token => filtered.includes(token) && !newNonSelectable.includes(token));
      setFilteredOptions(newOptions);
    } else {
      formatTokens();
    }
  };

  return (
    <>
      <div className="relative mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          name="search"
          id="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="block w-full h-14 md:h-14 pb-0 border-customLightGray pl-14 focus:border-customLightGray focus:ring-customLightGray rounded-5xl text-base md:text-xl placeholder:text-base md:placeholder:text-xl pt-0"
          placeholder="Search"
        />
      </div>
      {Object.keys(options)
        .filter((key) => !notSelectable.includes(key) && quickOptionsTokens.includes(key))
        .map((selectableToken) => (
          <div className="inline-flex mr-2 my-3" key={selectableToken}>
            <button
              className="flex items-center rounded-lg border border-customLightGray font-medium text-gray-800 py-2 px-3 md:py-2.5 md:px-4 text-base md:text-lg"
              onClick={() => {
                selectToken && selectToken(options[selectableToken].key);
                setShowSelectTokenModal(false);
              }}
            >
              <span className="w-5 h-5 relative mr-2">
                <Image
                  src={`/images/tokens/${options[selectableToken].img}`}
                  alt={options[selectableToken].img}
                  layout="fill"
                  objectFit="contain"
                  priority={true}
                />
              </span>
              <span>{options[selectableToken].name}</span>
            </button>
          </div>
        ))}
      <div className="mt-4">
        <ul className="scrollable__select py-6 overflow-y-auto shadow-scrollableSelect rounded-lg p-6 border border-customPaleGray">
          {filteredOptions.map((option) => (
            <li className="my-1 bg-transparent text-base md:text-lg hover:bg-customPaleGray hover:bg-opacity-40 rounded-lg" key={option}>
              <button
                onClick={() => {
                  selectToken(options[option].key);
                  setShowSelectTokenModal(false);
                }}
                className={`flex items-center py-3 px-3 ${selectedToken.key === options[option].key ? 'text-black font-semibold' : 'text-primary font-normal'}`}
              >
                <span className="w-5 h-5 inline-flex mr-3 flex-shrink-0">
                  <img src={`/images/tokens/${options[option].img}`} alt={options[option].name} className="h-full w-full object-contain" />
                </span>
                <span>{options[option].name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
