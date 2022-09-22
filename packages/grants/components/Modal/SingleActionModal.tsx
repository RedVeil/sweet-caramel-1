/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import Button from "components/CommonComponents/Button";
import React, { Fragment, useEffect, useState, useRef } from "react";
import * as Icon from "react-feather";
import { XIcon } from "@heroicons/react/outline";
import useClickOutside from "hooks/useClickOutside";


export interface SingleActionModalProps {
  title: string;
  children?: React.ReactElement;
  content?: string | React.ReactElement;
  visible: boolean;
  type?: "info" | "error" | "alert";
  image?: React.ReactElement;
  onConfirm?: { label: string; onClick: Function };
  onDismiss: { label?: string; onClick: Function };
  keepOpen?: boolean;
  showCloseButton?: boolean;
}

export const DefaultSingleActionModalProps: SingleActionModalProps = {
  content: "",
  title: "",
  visible: false,
  type: "info",
  keepOpen: false,
  showCloseButton: true,
  onDismiss: { onClick: () => { } }
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
  showCloseButton,
}) => {
  const [open, setOpen] = useState(visible);
  const cancelButtonRef = useRef();
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
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const dismiss = () => {
    setOpen(keepOpen);
    setTimeout(onDismiss.onClick, 1000);
  };

  useClickOutside<MouseEvent>(modalRef, dismiss);

  const confirm = () => {
    setOpen(keepOpen);
    setTimeout(onConfirm.onClick, 1000);
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-sm p-6 md:p-10 sm:align-middle w-88 md:max-w-[512px]">
                  {showCloseButton && (
                    <button className="flex justify-end">
                      <XIcon className="w-10 h-10 text-black mb-10" onClick={() => dismiss()} />
                    </button>
                  )}
                  <div>
                    {image ? (
                      <div className="flex justify-center">
                        <>{image}</>
                      </div>
                    ) : (
                      <>
                        {(type && type == "error" && (
                          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full  bg-red-100">
                            <svg
                              className="h-6 w-6 text-red-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          </div>
                        )) ||
                          (type && type == "alert" && (
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-400">
                              <svg
                                className="h-6 w-6 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <Icon.AlertCircle />
                              </svg>
                            </div>
                          ))}
                      </>
                    )}
                    <div className="text-center">
                      <h3 className="text-2xl leading-6 font-semibold text-gray-900 mt-5 mb-2" id="modal-title">
                        {title}
                      </h3>
                      <div>{children ? children : (
                        <p className="text-base md:text-sm text-gray-500">
                          <>{content}</>
                        </p>
                      )}
                      </div>
                    </div>
                    <div className="mt-5">
                      {onConfirm && (
                        <Button variant="primary" onClick={confirm} className="py-2 px-5 w-full">
                          {onConfirm?.label}
                        </Button>
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
