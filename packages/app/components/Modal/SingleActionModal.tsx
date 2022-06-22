/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import MainActionButton from "components/MainActionButton";
import SecondaryActionButton from "components/SecondaryActionButton";
import React, { Fragment, useEffect, useRef, useState } from "react";
import * as Icon from "react-feather";

export interface SingleActionModalProps {
  title: string;
  children?: React.ReactElement | React.ReactComponentElement<any>;
  content?: string | React.ReactElement;
  visible: boolean;
  type?: "info" | "error" | "alert";
  image?: React.ReactElement;
  onConfirm?: { label: string; onClick: Function };
  onDismiss?: { label: string; onClick: Function };
  keepOpen?: boolean;
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
        onClose={() => setOpen(false)}
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
                  className="fixed inset-0 -z-10 bg-gray-500 bg-opacity-75 transition-opacity"
                  aria-hidden="true"
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                  &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-4xl px-5 pt-6 pb-5 mb-12 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                  <div>
                    {image ? (
                      <>{image}</>
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
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-2xl leading-6 font-semibold text-gray-900" id="modal-title">
                        {title}
                      </h3>
                      <div className="mt-2 py-6">
                        {children ? children : <p className="text-base md:text-sm text-gray-500">{content}</p>}
                      </div>
                    </div>
                  </div>
                  <div className={`${onConfirm || onDismiss ? "mt-8" : ""}`}>
                    <div>
                      {onConfirm && (
                        <>
                          <MainActionButton label={onConfirm.label} handleClick={confirm} />
                        </>
                      )}
                      {onDismiss && (
                        <>
                          <SecondaryActionButton label={onDismiss.label} handleClick={dismiss} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default SingleActionModal;
