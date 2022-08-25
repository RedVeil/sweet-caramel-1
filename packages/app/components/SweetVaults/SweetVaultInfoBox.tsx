import { ArrowCircleRightIcon } from "@heroicons/react/outline";
import { setMobileFullScreenModal } from "context/actions";
import { store } from "context/store";
import { useContext } from "react";

export default function SweetVaultInfoBox({ titleText, bodyText }: { titleText: string; bodyText: string }) {
  const { dispatch } = useContext(store);

  return (
    <>
      <div className="h-full p-8 rounded-3xl hidden md:flex flex-col bg-white border border-gray-300 overflow-y-scroll scrollbar-hide">
        <p className="font-medium text-lg text-left w-full text-gray-900">{titleText}</p>
        <p className="font-normal hidden md:flex text-lg text-gray-500">{bodyText}</p>
      </div>
      <div
        onClick={() => {
          dispatch(
            setMobileFullScreenModal({
              title: titleText,
              content: bodyText,
              onDismiss: () => dispatch(setMobileFullScreenModal(false)),
            }),
          );
        }}
        className="h-full p-2 px-4 rounded-3xl flex flex-row md:hidden justify-between bg-white border border-gray-300"
      >
        <p className="font-medium text-xl text-center w-full text-gray-900">{titleText}</p>
        <ArrowCircleRightIcon height={24} className="self-center ml-2 " />
      </div>
    </>
  );
}
