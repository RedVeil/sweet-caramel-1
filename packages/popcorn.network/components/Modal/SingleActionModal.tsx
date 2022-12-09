/* This example requires Tailwind CSS v2.0+ */
import React, { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import TertiaryActionButton from "components/CommonComponents/TertiaryActionButton";
import MainActionButton from "components/MainActionButton";
import Image from "next/image";

export interface SingleActionModalProps {
  title: string;
  children?: React.ReactElement | React.ReactComponentElement<any>;
  content?: string | React.ReactElement;
  visible: boolean;
  type?: "info" | "error" | "alert";
  image?: React.ReactElement;
  onConfirm?: { label: string; onClick: Function };
  onDismiss?: { label?: string; onClick: Function };
  keepOpen?: boolean;
  isTerms?: boolean;
}
export const DefaultSingleActionModalProps: SingleActionModalProps = {
  content: "",
  title: "",
  visible: false,
  type: "info",
  keepOpen: false,
};

export const SingleActionModal: React.FC<SingleActionModalProps> = ({
  title,
  visible,
  children,
  content,
  image,
  onConfirm,
  onDismiss,
  keepOpen,
  isTerms,
}) => {
  const [open, setOpen] = useState(visible);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (visible !== open) setOpen(visible);

    return () => {
      setOpen(false);
    };
  }, [visible]);

  const dismiss = () => {
    setOpen(keepOpen);
    setTimeout(() => onDismiss?.onClick(), 1000);
  };

  const confirm = () => {
    setOpen(keepOpen);
    setTimeout(() => onConfirm.onClick(), 10);
  };

  if (!visible) return <></>;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-50 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={() => (keepOpen ? {} : dismiss())}
      >
        <div className="fixed inset-0 bg-primary bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div>
                <Dialog.Panel
                  className={`relative transform overflow-hidden rounded-lg bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-sm p-6 smmd:p-8 sm:align-middle ${
                    isTerms ? "w-88 smmd:max-w-lg" : "w-88 smmd:max-w-lg"
                  }`}
                >
                  {!isTerms && (
                    <div className="flex justify-end mb-6 smmd:mb-8">
                      <button className="w-6 h-6 relative" onClick={dismiss}>
                        <Image
                          src="/images/closeIcon.svg"
                          alt="close icon"
                          layout="fill"
                          objectFit="contain"
                          priority={true}
                        />
                      </button>
                    </div>
                  )}
                  <div>
                    <div className="text-zero">{image}</div>
                    <div className={isTerms ? "" : "mt-5 smmd:mt-8"}>
                      <h3
                        className="text-4xl lg:-mt-0 leading-11 smmd:text-6xl smmd:leading-13 text-black"
                        id="modal-title"
                      >
                        {title}
                      </h3>
                      <div className="mt-4">
                        {children ? (
                          children
                        ) : (
                          <div className="text-base smmd:text-sm text-primaryDark leading-5">{content}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`${onConfirm || onDismiss?.label ? "mt-8" : ""}`}>
                    <div>
                      {onConfirm && (
                        <>
                          <MainActionButton label={onConfirm.label} handleClick={confirm} />
                        </>
                      )}
                      {onDismiss?.label && (
                        <>
                          <TertiaryActionButton label={onDismiss.label} handleClick={dismiss} />
                        </>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default SingleActionModal;
