import { Transition } from "@headlessui/react";
import React from "react";

interface PopUpModalProps {
  children: React.ReactNode;
  visible: boolean;
  onClosePopUpModal: () => void;
}
const PopUpModal = ({ children, visible, onClosePopUpModal }) => {
  const onClickParent = (e) => {
    if (e.target === e.currentTarget) {
      onClosePopUpModal();
    }
  };
  return (
    <>
      <Transition show={visible}>
        <div className="fixed top-0 z-40 h-screen w-screen bottom-0">
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
            <div className="relative">
              <div className="absolute bottom-0 bg-white rounded-t-4xl p-6 w-full">{children}</div>
            </div>
          </Transition.Child>
        </div>
      </Transition>
    </>
  );
};

export default PopUpModal;
