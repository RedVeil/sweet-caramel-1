/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import MainActionButton from "components/MainActionButton";
import SecondaryActionButton from "components/SecondaryActionButton";
import React, { Fragment, useEffect, useRef, useState } from "react";
import * as Icon from "react-feather";

export interface NetworkChangePromptModalProps {
  title: string;
  children?: React.ReactElement;
  content?: string;
  visible: boolean;
  type?: "info" | "error" | "alert";
  image?: React.ReactElement;
  onChangeUrl?: { label: string; onClick: Function };
  onChangeNetwork?: { label: string; onClick: Function };
  onDisconnect?: { label: string; onClick: Function };
}
export const DefaultNetworkChangePromptModalProps: NetworkChangePromptModalProps = {
  content: "",
  title: "",
  visible: false,
  type: "error",
};

export const NetworkChangePromptModal: React.FC<NetworkChangePromptModalProps> = ({
  title,
  type,
  visible,
  children,
  content,
  image,
  onChangeUrl,
  onChangeNetwork,
  onDisconnect,
}) => {
  const [open, setOpen] = useState(visible);
  const cancelButtonRef = useRef();

  useEffect(() => {
    if (visible !== open) setOpen(visible);
    return () => {
      setOpen(false);
    };
  }, [visible]);

  const changeNetwork = () => {
    setTimeout(() => onChangeNetwork?.onClick && onChangeNetwork.onClick(), 1000);
  };

  const changeUrl = () => {
    setTimeout(() => onChangeUrl?.onClick && onChangeUrl.onClick(), 1000);
  };

  const disconnect = () => {
    setTimeout(() => onDisconnect?.onClick && onDisconnect.onClick(), 1000);
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
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                  &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-4xl px-5 pt-4 md:pt-6 pb-5 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-8">
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
                    <div className="mt-2 md:mt-6 text-center">
                      <h3 className="text-2xl leading-8 font-medium text-gray-900 w-10/12 mx-auto" id="modal-title">
                        {title}
                      </h3>
                      <div className="mt-2">
                        {children ? children : <p className="text-base text-gray-600">{content}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 md:mt-8">
                    <div>
                      {onChangeNetwork && (
                        <>
                          <MainActionButton label={onChangeNetwork.label} handleClick={changeNetwork} />
                        </>
                      )}
                      {onChangeUrl && (
                        <div className="w-full">
                          {/* or */}
                          <div className="flex justify-center vertical-align h-6 my-3 md:my-7">
                            <img src="/images/butter/primary-btn-divider.svg" />
                          </div>
                          <SecondaryActionButton label={onChangeUrl.label} handleClick={changeUrl} />
                        </div>
                      )}
                      {onDisconnect && (
                        <div className="w-full">
                          {/* or */}
                          <div className="flex justify-center vertical-align h-6 my-3 md:my-7">
                            <img src="/images/butter/primary-btn-divider.svg" />
                          </div>
                          <SecondaryActionButton label={onDisconnect.label} handleClick={disconnect} />
                        </div>
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
export default NetworkChangePromptModal;
