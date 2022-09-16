import { Transition } from "@headlessui/react";
import React, { FC } from "react";

interface PopUpModalProps {
  children: any;
  visible: boolean;
  onClosePopUpModal: () => void;
}
const PopUpModal: FC<PopUpModalProps> = ({ children, visible, onClosePopUpModal }) => {
  const onClickParent = (e: any) => {
    if (e.target === e.currentTarget) {
      onClosePopUpModal();
    }
  };
  return (
    <>
      <Transition show={visible}>
        <div className="fixed top-0 z-40 h-screen w-screen left-0">
          <Transition.Child
            enter="transition ease-out duration-300 transform"
            enterFrom="opacity-0 translate-y-full"
            enterTo="opacity-100 translate-y-0"
            leave="transition transform ease-in duration-300"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-full"
          >
            <div className="h-screen w-screen bg-primary bg-opacity-75" onClick={onClickParent}></div>
          </Transition.Child>

          <Transition.Child
            enter="transition ease-out duration-300 transform"
            enterFrom="opacity-0 translate-y-full"
            enterTo="opacity-100 translate-y-0"
            leave="transition transform ease-in duration-300"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-full"
          >
            <div className="absolute bottom-0 bg-white rounded-t-4xl p-6 w-full">{children}</div>
          </Transition.Child>
        </div>
      </Transition>
    </>
  );
};

export default PopUpModal;
