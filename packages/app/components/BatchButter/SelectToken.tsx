import { FC, Dispatch, useState, useEffect, useMemo, SetStateAction } from "react"
import { ChevronDownIcon, SearchIcon } from "@heroicons/react/outline";
import { BatchProcessTokenKey, TokenMetadata, Tokens } from "@popcorn/utils/src/types";
import Image from "next/image";
import WheelPicker, { PickerData } from "react-simple-wheel-picker";
import SingleActionModal from "components/Modal/SingleActionModal";
import PopUpModal from "components/Modal/PopUpModal";
interface SelectTokenProps {
  allowSelection: boolean;
  options: Tokens;
  selectedToken: TokenMetadata;
  notSelectable: string[];
  selectToken?: (token: BatchProcessTokenKey) => void;
}

interface SearchTokenProps extends Omit<SelectTokenProps, "allowSelection"> {
  setNewTokenKey: Dispatch<SetStateAction<string | null>>
  setShowSelectTokenModal: Dispatch<SetStateAction<boolean>>
}

const SearchToken: FC<SearchTokenProps> = (props) => {
  const { notSelectable, options, selectToken, setShowSelectTokenModal, selectedToken, setNewTokenKey } = props;
  const quickOptionsTokens = ['dai', 'usdt', 'usdc']
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<PickerData[]>([]);


  const formatTokens = () => {
    const tokens = Object.keys({ ...options }).filter((token) => !notSelectable.includes(token)) ?? [];
    const transformedTokens = tokens.map((token) => {
      return {
        value: token,
        id: token,
      }
    })
    setFilteredOptions(transformedTokens)
  }

  useEffect(() => {
    formatTokens()
  }, [options, notSelectable, selectedToken])

  const handleChange = (value: PickerData) => {
    setNewTokenKey(value.id)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const filtered = Object.keys({ ...options }).filter((token) => {
      const tokenName = options[token].name.toLowerCase();
      const searchValue = e.target.value.toLowerCase();
      return tokenName.includes(searchValue);
    }) ?? [];
    const newOptions = Object.keys({ ...options }).filter((token) => filtered.includes(token) && !notSelectable.includes(token)) ?? [];
    const transformedTokens = newOptions.map((token) => {
      return {
        value: token,
        id: token,
      }
    })
    setFilteredOptions(transformedTokens ?? [])
  };

  return (
    <>
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          name="search"
          id="search"
          value={search}
          onChange={handleSearchChange}
          className="block w-full h-14 md:h-18 pb-0 border-customLightGray pl-14 focus:border-customLightGray focus:ring-customLightGray rounded-5xl text-sm md:text-2xl placeholder:text-base md:placeholder-text-2xl pt-0"
          placeholder="Search a name"
        />
      </div>
      {Object.keys(options)
        .filter((key) => !notSelectable.includes(key) && quickOptionsTokens.includes(key))
        .map((selectableToken) => (
          <div className="inline-flex mr-2 my-3">
            <button
              className="flex items-center rounded-lg border border-customLightGray font-medium text-gray-800 py-1 px-2 md:py-2 md:px-4 text-base md:text-lg"
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
              <span>
                {options[selectableToken].name}
              </span>
            </button>
          </div>
        ))}
      <div className="wheelPicker custom-wheel__picker">
        {filteredOptions?.length > 0 && (
          <WheelPicker
            data={filteredOptions}
            onChange={handleChange}
            height={200}
            selectedID={filteredOptions[0].id}
            titleText="Enter value same as aria-label"
            itemHeight={30}
            color="#e5e7eb"
            activeColor="#111827"
            backgroundColor="#fff"
          />
        )}
      </div>
    </>
  )
}

export default function SelectToken({
  allowSelection,
  options,
  selectedToken,
  notSelectable,
  selectToken,
}: SelectTokenProps): JSX.Element {
  const [newTokenKey, setNewTokenKey] = useState('usdc')
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false)
  const [showPopUp, setShowPopUp] = useState<boolean>(false);

  const openPopUp = () => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    if (mediaQuery.matches) {
      setShowSelectTokenModal(true)
    } else {
      setShowPopUp(true)
    }
  }

  return (
    <>
      <div className="relative w-auto justify-end">
        <span
          className={`flex flex-row items-center justify-end ${allowSelection ? "cursor-pointer group" : "mr-4"}`}
          onClick={() => {
            allowSelection && openPopUp()
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
                className={`w-10 h-6 ml-2 text-secondaryLight group-hover:text-primary transform transition-all ease-in-out duration-200 ${showPopUp || showSelectTokenModal ? " rotate-180" : ""
                  }`}
              />
            </>
          )}

        </span>
      </div>
      <SingleActionModal
        image={<Image src="/images/blackCircle.svg" width={88} height={88} />}
        visible={showSelectTokenModal}
        title="Search a token"
        keepOpen={false}
        content={(
          <div className="mt-8">
            <SearchToken
              options={options}
              notSelectable={notSelectable}
              selectToken={selectToken}
              setShowSelectTokenModal={setShowSelectTokenModal}
              selectedToken={selectedToken}
              setNewTokenKey={setNewTokenKey}
            />
          </div>
        )}
        onDismiss={{
          onClick: () => {
            if (newTokenKey) {
              selectToken && selectToken(newTokenKey as BatchProcessTokenKey)
            }
            setNewTokenKey(null)
            setShowSelectTokenModal(false);
          },
        }}
      />
      <div className="fixed z-100 left-0">
        <PopUpModal visible={showPopUp} onClosePopUpModal={() => {
          if (newTokenKey) {
            selectToken && selectToken(newTokenKey as BatchProcessTokenKey)
          }
          setNewTokenKey(null);
          setShowPopUp(false);
        }}>
          <p className="text-base text-black font-normal mb-2">Search a token</p>
          <SearchToken
            options={options}
            notSelectable={notSelectable}
            selectToken={selectToken}
            setShowSelectTokenModal={setShowPopUp}
            selectedToken={selectedToken}
            setNewTokenKey={setNewTokenKey}
          />
        </PopUpModal>
      </div>
    </>
  );
}
