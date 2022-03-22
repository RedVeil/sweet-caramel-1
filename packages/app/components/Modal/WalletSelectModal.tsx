/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";

export interface WalletSelectModalProps {
  children?: React.ReactElement;
  content?: string;
  visible: boolean;
  type?: "info" | "error" | "alert";
  image?: React.ReactElement;
  onConfirm?: { label: string; onClick: Function };
  onDismiss?: { label: string; onClick: Function };
  keepOpen?: boolean;
  closeModal?: Function;
  fullScreen?: boolean;
  dimensions?: string;
}
export const DefaultWalletSelectModalProps: WalletSelectModalProps = {
  content: "",
  visible: false,
  type: "info",
  keepOpen: false,
};

export const WalletSelectModal: React.FC<WalletSelectModalProps> = ({
  visible,
  children,
  onDismiss,
  keepOpen,
  closeModal,
  fullScreen,
  dimensions,
}) => {
  const [open, setOpen] = useState(visible);
  const cancelButtonRef = useRef();

  useEffect(() => {
    if (visible !== open) setOpen(visible);
    return () => {
      setOpen(false);
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    setOpen(keepOpen);
    setTimeout(() => (onDismiss?.onClick ? onDismiss.onClick() : closeModal && closeModal()), 1000);
  }, [closeModal, onDismiss]);

  if (!visible) return <></>;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-50 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="flex w-screen items-end justify-center min-h-screen text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="flex items-center justify-center min-h-screen text-center">
              <div
                onClick={dismiss}
                className="fixed justify-center items-center inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
              ></div>
              <div
                className={`flex ${
                  fullScreen ? "h-screen w-screen" : dimensions || "h-min md:w-min w-screen rounded-4xl"
                } text-left overflow-hidden justify-center transform transition-all`}
              >
                {children && children}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default WalletSelectModal;
