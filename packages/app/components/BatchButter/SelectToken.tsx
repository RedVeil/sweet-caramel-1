import { ChevronDownIcon } from "@heroicons/react/outline";
import { Token } from "@popcorn/utils/types";
import PopUpModal from "components/Modal/PopUpModal";
import SingleActionModal from "components/Modal/SingleActionModal";
import PLACEHOLDER_IMAGE_URL from "helper/placeholderImageUrl";
import Image from "next/image";
import { useState } from "react";
import { SearchToken } from "./SearchToken";

export interface SelectTokenProps {
  allowSelection: boolean;
  options: Token[];
  selectedToken: Token;
  selectToken?: (token: Token) => void;
}

export default function SelectToken({
  allowSelection,
  options,
  selectedToken,
  selectToken,
}: SelectTokenProps): JSX.Element {
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
              src={selectedToken?.icon || PLACEHOLDER_IMAGE_URL}
              alt={selectedToken?.icon}
              layout="fill" // required
              objectFit="contain"
              priority={true}
            />
          </div>
          <p className="font-medium text-lg leading-none hidden md:block text-black group-hover:text-primary">
            {selectedToken?.symbol}
          </p>

          {allowSelection && (
            <>
              <ChevronDownIcon
                className={`w-6 h-6 ml-2 text-secondaryLight group-hover:text-primary transform transition-all ease-in-out duration-200 ${
                  showPopUp || showSelectTokenModal ? " rotate-180" : ""
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
              selectToken={(token) => {
                selectToken(token);
                setShowSelectTokenModal(false);
              }}
              selectedToken={selectedToken}
            />
          </div>
        }
        onDismiss={{
          onClick: () => {
            setShowSelectTokenModal(false);
          },
        }}
      />
      <div className="fixed z-100 left-0">
        <PopUpModal
          visible={showPopUp}
          onClosePopUpModal={() => {
            setShowPopUp(false);
          }}
        >
          <p className="text-base text-black font-normal mb-2">Select a token</p>
          <SearchToken
            options={options}
            selectToken={(token) => {
              selectToken(token);
              setShowSelectTokenModal(false);
            }}
            selectedToken={selectedToken}
          />
        </PopUpModal>
      </div>
    </>
  );
}
