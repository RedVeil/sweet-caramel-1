/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import MainActionButton from "components/MainActionButton";
import TertiaryActionButton from "components/TertiaryActionButton";
import useClickOutside from "hooks/useClickOutside";
import React, { Fragment, useEffect, useRef, useState } from "react";

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
  type,
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
  const modalRef = useRef(null);

  useEffect(() => {
    if (visible !== open) setOpen(visible);

    return () => {
      setOpen(false);
    };
  }, [visible]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const dismiss = () => {
    setOpen(keepOpen);
    setTimeout(() => onDismiss?.onClick && onDismiss.onClick(), 1000);
  };

  useClickOutside<MouseEvent>(modalRef, () => dismiss());

  const confirm = () => {
    setOpen(keepOpen);
    setTimeout(() => onConfirm?.onClick && onConfirm.onClick(), 1000);
  };

  if (!visible) return <></>;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-50 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={() => (keepOpen ? {} : setOpen(false))}
      >
        <div className="fixed inset-0 bg-primary bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div ref={modalRef}>
                <Dialog.Panel className={`relative transform overflow-hidden rounded-lg bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-sm p-6 md:p-10 sm:align-middle ${isTerms ? "w-88 md:max-w-lg" : "w-88 md:max-w-lg"
                  }`}>
                  {!isTerms && (
                    <div className="flex justify-end">
                      <XIcon className="w-10 h-10 text-black mb-10" onClick={dismiss} role="button" />
                    </div>
                  )}
                  <div>
                    {image}
                    <div className={isTerms ? "" : "mt-10"}>
                      <h3 className="text-6xl leading-13 text-black" id="modal-title">
                        {title}
                      </h3>
                      <div className="mt-4">
                        {children ? (
                          children
                        ) : (
                          <div className="text-base md:text-sm text-primaryDark leading-5">{content}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`${onConfirm || onDismiss?.label ? "mt-10" : ""}`}>
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
