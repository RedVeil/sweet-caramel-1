import { ChevronDownIcon } from "@heroicons/react/outline";
import { BatchProcessTokenKey, TokenMetadata, Tokens } from "@popcorn/utils/src/types";
import PopUpModal from "components/Modal/PopUpModal";
import SingleActionModal from "components/Modal/SingleActionModal";
import Image from "next/image";
import { useState } from "react";
import { SearchToken } from "./SearchToken";

export interface SelectTokenProps {
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
  const [newTokenKey, setNewTokenKey] = useState("usdc");
  const [showSelectTokenModal, setShowSelectTokenModal] = useState(false);
  const [showPopUp, setShowPopUp] = useState<boolean>(false);

  const openPopUp = () => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    if (mediaQuery.matches) {
      setShowSelectTokenModal(true);
    } else {
      setShowPopUp(true);
    }
  };

  return (
    <>
      <div className="relative w-auto justify-end">
        <span
          className={`flex flex-row items-center justify-end ${allowSelection ? "cursor-pointer group" : ""}`}
          onClick={() => {
            allowSelection && openPopUp();
          }}
        >
          <div className="w-5 h-5 md:mr-2 relative">
            <Image
              src={`/images/tokens/${selectedToken?.img}`}
              alt={selectedToken?.img}
              layout="fill" // required
              objectFit="contain"
              priority={true}
            />
          </div>
          <p className="font-medium text-lg leading-none hidden md:block text-black group-hover:text-primary">
            {selectedToken.name}
          </p>

          {allowSelection && (
            <>
              <ChevronDownIcon
                className={`w-6 h-6 ml-2 text-secondaryLight group-hover:text-primary transform transition-all ease-in-out duration-200 ${showPopUp || showSelectTokenModal ? " rotate-180" : ""
                  }`}
              />
            </>
          )}
        </span>
      </div>
      <SingleActionModal
        image={<Image src="/images/blackCircle.svg" width={88} height={88} />}
        visible={showSelectTokenModal}
        title="Select a token"
        keepOpen={false}
        content={
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
        }
        onDismiss={{
          onClick: () => {
            if (newTokenKey) {
              selectToken && selectToken(newTokenKey as BatchProcessTokenKey);
            }
            setNewTokenKey(null);
            setShowSelectTokenModal(false);
          },
        }}
      />
      <div className="fixed z-100 left-0">
        <PopUpModal
          visible={showPopUp}
          onClosePopUpModal={() => {
            if (newTokenKey) {
              selectToken && selectToken(newTokenKey as BatchProcessTokenKey);
            }
            setNewTokenKey(null);
            setShowPopUp(false);
          }}
        >
          <p className="text-base text-black font-normal mb-2">Select a token</p>
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
