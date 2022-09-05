import { FC, Dispatch, useState, useContext, useMemo } from "react"
import { ChevronDownIcon, SearchIcon } from "@heroicons/react/outline";
import { BatchProcessTokenKey, TokenMetadata, Tokens } from "@popcorn/utils/src/types";
import Image from "next/image";
import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import WheelPicker, { PickerData } from "react-simple-wheel-picker";


interface SelectTokenProps {
  allowSelection: boolean;
  options: Tokens;
  selectedToken: TokenMetadata;
  notSelectable: string[];
  selectToken?: (token: BatchProcessTokenKey) => void;
}

interface SearchTokenProps extends Omit<SelectTokenProps, "allowSelection"> {
  dispatch: Dispatch<any>
}

const SearchToken: FC<SearchTokenProps> = (props) => {
  const { notSelectable, options, selectToken, dispatch, selectedToken } = props;
  const quickOptionsTokens = ['dai', 'usdt', 'usdc']
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<Tokens>(options);

  const transformTokenOptions = useMemo(() => {
    const tokens = Object.keys(options).filter((token) => !notSelectable.includes(token))
    return [...tokens, selectedToken.key].map((token) => {
      return {
        value: token,
        id: token,
      }
    })
  }, [options, notSelectable, selectedToken])

  const handleChange = (value: PickerData) => {
    if (selectToken) {
      const allOptions = { ...options, selectedToken }
      const newToken = Object.keys(allOptions).find((token) => token === value.id)
      console.log("🚀 ~ file: SelectToken.tsx ~ line 42 ~ newToken ~ newToken", allOptions[newToken])
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // filter through the options and save available options im state
    const filtered = Object.keys(options).filter((token) => {
      const tokenName = options[token].name.toLowerCase();
      const searchValue = e.target.value.toLowerCase();
      return tokenName.includes(searchValue);
    });
    const filteredOptions = Object.keys(options).filter((token) => filtered.includes(token));
    setFilteredOptions(filteredOptions.reduce((acc, token) => {
      acc[token] = options[token]
      return acc
    }, {} as Tokens))
  };

  return (
    <div className="mt-8">
      <div className="relative mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {console.log('filteredOptions', filteredOptions)}
          <SearchIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="search"
          name="search"
          id="search"
          value={search}
          onChange={handleSearchChange}
          className="block w-full h-18 pb-0 border-customLightGray pl-14 focus:border-customLightGray focus:ring-customLightGray sm:text-base rounded-5xl text-2xl placeholder:text-2xl"
          placeholder="Search a name"
        />
      </div>
      {Object.keys(options)
        .filter((key) => !notSelectable.includes(key) && quickOptionsTokens.includes(key))
        .map((selectableToken) => (
          <div className="inline-flex mr-2 my-3">
            <button
              className="flex items-center rounded-lg border border-customLightGray font-medium text-gray-800 py-2 px-4 text-lg"
              onClick={() => {
                selectToken && selectToken(options[selectableToken].key);
                dispatch(setSingleActionModal(false));
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
              <span>
                {options[selectableToken].name}
              </span>
            </button>
          </div>
        ))}
      <div className="wheelPicker">
        <WheelPicker
          data={transformTokenOptions}
          onChange={handleChange}
          height={200}
          selectedID={selectedToken?.key}
          titleText="Enter value same as aria-label"
          itemHeight={30}
          color="#e5e7eb"
          activeColor="#111827"
          backgroundColor="#fff"
        />
      </div>
    </div>
  )
}

export default function SelectToken({
  allowSelection,
  options,
  selectedToken,
  notSelectable,
  selectToken,
}: SelectTokenProps): JSX.Element {
  const [showDropdown, setDropdown] = useState<boolean>(false);
  const { dispatch } = useContext(store);

  return (
    <div className="relative w-auto justify-end" onMouseLeave={() => setDropdown(false)}>
      <span
        className={`flex flex-row items-center justify-end ${allowSelection ? "cursor-pointer group" : "mr-4"}`}
        onClick={() => {
          allowSelection && dispatch(
            setSingleActionModal({
              image: <Image src="/images/blackCircle.svg" width={100} height={100} />,
              title: "Search a token",
              content: <SearchToken options={options} notSelectable={notSelectable} selectToken={selectToken} dispatch={dispatch} selectedToken={selectedToken} />,
              visible: true,
              onDismiss: {
                onClick: () => {
                  dispatch(setSingleActionModal(false));
                },
              },
            }),
          );
        }}
      >
        <div className="w-5 h-5 mr-2 relative hidden md:block">
          <Image
            src={`/images/tokens/${selectedToken?.img}`}
            alt={selectedToken?.img}
            layout="fill" // required
            objectFit="contain"
            priority={true}
          />
        </div>
        <p className="font-medium text-lg leading-none text-black group-hover:text-primary">{selectedToken.name}</p>

        {allowSelection && (
          <>
            <ChevronDownIcon
              className={`w-10 h-6 ml-2 text-secondaryLight group-hover:text-primary transform transition-all ease-in-out duration-200 ${showDropdown ? " rotate-180" : ""
                }`}
            />
          </>
        )}
      </span>
    </div>
  );
}
