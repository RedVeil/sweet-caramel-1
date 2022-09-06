/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import MainActionButton from "components/MainActionButton";
import TertiaryActionButton from "components/TertiaryActionButton";
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
  const cancelButtonRef = useRef();

  useEffect(() => {
    if (visible !== open) setOpen(visible);
    return () => {
      setOpen(false);
    };
  }, [visible]);

  const dismiss = () => {
    setOpen(keepOpen);
    setTimeout(() => onDismiss?.onClick && onDismiss.onClick(), 1000);
  };

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
        open={open}
        onClose={() => (keepOpen ? {} : setOpen(false))}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed z-50 inset-0 overflow-y-auto"
              aria-labelledby="modal-title"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 -z-10 bg-primary bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                  &#8203;
                </span>
                <Dialog.Panel className="absolute flex top-0 w-full h-full justify-center sm:items-center items-end pb-20">
                  <div
                    className={`inline-block align-bottom bg-white rounded-lg p-6 md:p-10 mb-12 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:w-full sm:p-6 ${isTerms ? "w-88 md:max-w-lg" : "w-88 md:max-w-md"
                      }`}
                  >
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
                            <p className="text-base md:text-sm text-primaryDark leading-5">{content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`${onConfirm || onDismiss ? "mt-10" : ""}`}>
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
                  </div>
                </Dialog.Panel>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default SingleActionModal;
