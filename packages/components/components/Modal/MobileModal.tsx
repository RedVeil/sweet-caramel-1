/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useEffect, useRef, useState } from "react";
import * as Icon from "react-feather";
import { MobileFullScreenModalProps } from "@popcorn/components/components/Modal/MobileFullScreenModal";

export const DefaultMobileActionModalProps: MobileFullScreenModalProps = {
  content: "",
  title: "",
  visible: false,
};

export const MobileModal: React.FC<MobileFullScreenModalProps> = ({
  title,
  type,
  visible,
  children,
  content,
  image,
  onDismiss,
}) => {
  const [open, setOpen] = useState(visible);
  const cancelButtonRef = useRef();

  const dismiss = () => {
    setOpen(false);
    setTimeout(() => onDismiss && onDismiss(), 1000);
  };

  useEffect(() => {
    if (visible !== open) setOpen(visible);
    return () => {
      setOpen(false);
    };
  }, [visible]);

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
        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-300 transform"
          enterFrom="opacity-0 translate-x-full"
          enterTo="opacity-100 translate-x-0"
          leave="transition transform ease-in duration-300"
          leaveFrom="opacity-100 translate-x-0"
          leaveTo="opacity-0 translate-x-full"
        >
          <div className="fixed w-full h-full bg-white p-6">
            {onDismiss && (
              <Icon.ChevronLeft onClick={dismiss} className="text-gray-900 h-7 absolute top-10 left-7 color-gray-900" />
            )}
            <div className="flex flex-col justify-center items-center h-full w-full">
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
              <div className="flex flex-col px-8 text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2 py-6">
                  {children ? children : <p className="text-lg text-gray-500">{content}</p>}
                </div>
              </div>
            </div>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
};
export default MobileModal;
