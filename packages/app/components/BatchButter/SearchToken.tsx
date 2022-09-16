import { FC, Dispatch, useState, SetStateAction, useEffect, useRef } from "react"
import { SearchIcon } from "@heroicons/react/outline";
import { SelectTokenProps } from "components/BatchButter/SelectToken";
import Image from "next/image";
import WheelPicker, { PickerDataWithIcon } from "components/WheelPicker/WheelPicker";
import { BatchProcessTokenKey, TokenMetadata, Tokens } from "@popcorn/utils/src/types";
interface SearchTokenProps extends Omit<SelectTokenProps, "allowSelection"> {
  setNewTokenKey: Dispatch<SetStateAction<string | null>>;
  setShowSelectTokenModal: Dispatch<SetStateAction<boolean>>;
}

export const SearchToken: FC<SearchTokenProps> = ({
  notSelectable,
  options,
  selectToken,
  setShowSelectTokenModal,
  selectedToken,
  setNewTokenKey,
}) => {
  const quickOptionsTokens = ["dai", "usdt", "usdc", "eth", "wbtc"];
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<PickerDataWithIcon[]>([]);
  const wheelPickerRef = useRef(null)

  const saveFilteredTokensToState = (tokens: string[]) => {
    const transformedTokens: PickerDataWithIcon[] = tokens.map((token) => {
      return {
        value: options[token].name,
        id: token,
        icon: options[token].img,
      };
    });
    setFilteredOptions(transformedTokens);
  };

  const formatTokens = () => {
    const tokens = Object.keys(options).filter((token) => !notSelectable.includes(token));
    saveFilteredTokensToState(tokens);
  };

  useEffect(() => {
    formatTokens();
  }, [options, notSelectable, selectedToken])

  useEffect(() => {
    const wheelPicker = wheelPickerRef.current
    if (wheelPicker) {
      wheelPicker.addEventListener("click", (e) => {
        const target = e.target as HTMLElement
        if (target && target?.parentElement) {
          const tokenKey = target?.parentElement?.getAttribute("data-itemid")
          if (tokenKey) {
            selectToken(tokenKey as BatchProcessTokenKey)
            setShowSelectTokenModal(false)
          }
        }
      })
    }
    return () => {
      if (wheelPicker) {
        wheelPicker.removeEventListener('click', () => { })
      }

    }
  }, [wheelPickerRef?.current])


  const handleChange = (value: PickerDataWithIcon) => {
    setNewTokenKey(value.id);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const filtered = Object.keys(options).filter((token) => {
      const tokenName = options[token].name.toLowerCase();
      const searchValue = value.toLowerCase();
      return tokenName.includes(searchValue);
    });
    const newOptions = Object.keys(options).filter(
      (token) => filtered.includes(token) && !notSelectable.includes(token),
    );
    saveFilteredTokensToState(newOptions);
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
      <div className="wheelPicker mt-4" ref={wheelPickerRef}>
        {filteredOptions?.length > 0 && (
          <WheelPicker
            dataWithIcons={filteredOptions}
            onChange={handleChange}
            height={200}
            selectedID={filteredOptions[0].id}
            titleText="Enter value same as aria-label"
            itemHeight={30}
            renderWithIcon
            color="#e5e7eb"
            activeColor="#111827"
            backgroundColor="#fff"
          />
        )}
      </div>
    </>
  );
};
