/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import MainActionButton from "../MainActionButton";
import TertiaryActionButton from "../TertiaryActionButton";
import React, { Fragment, useEffect, useRef, useState } from "react";

export interface DualActionWideModalProps {
  title: string;
  content: JSX.Element | string;
  visible: boolean;
  progress?: boolean;
  onDismiss?: { label: string; onClick: Function };
  onConfirm?: { label: string; onClick: Function };
  icon?: "check";
  image?: any;
  keepOpen?: boolean;
}

export const DefaultDualActionWideModalProps = {
  content: "",
  title: "",
  visible: false,
  progress: false,
  keepOpen: false,
};

const Example: React.FC<DualActionWideModalProps> = ({
  content,
  title,
  visible,
  progress,
  onConfirm,
  onDismiss,
  icon,
  image,
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
    setTimeout(() => onDismiss?.onClick && onDismiss.onClick(), 500);
  };

  const confirm = () => {
    setOpen(keepOpen);
    setTimeout(() => onConfirm?.onClick && onConfirm.onClick(), 500);
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
            <Dialog.Overlay className="fixed inset-0 bg-primary bg-opacity-75 transition-opacity backdrop-filter backdrop-blur" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="absolute flex top-0 w-full h-full justify-center sm:items-center items-end pb-20">
              <div className="inline-block align-bottom bg-white rounded-lg p-6 md:p-10 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle w-88 md:max-w-md sm:w-full sm:p-6">
                <div className="flex justify-end">
                  <XIcon className="w-10 h-10 text-black mb-10" onClick={dismiss} role="button" />
                </div>
                <div>
                  {image}
                  <div className="mt-10">
                    <h3 className="text-6xl leading-13 text-black" id="modal-title">
                      {title}
                    </h3>
                    <div className="mt-4">
                      {typeof content === "string" ? (
                        <p className="text-base md:text-sm text-primaryDark leading-5">{content}</p>
                      ) : (
                        <>{content}</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-10 flex flex-col gap-6 md:gap-0 md:space-y-6">
                  {onConfirm && (
                    <MainActionButton
                      disabled={progress}
                      label={onConfirm.label}
                      handleClick={() => confirm()}
                    ></MainActionButton>
                  )}
                  {onDismiss && (
                    <TertiaryActionButton
                      disabled={progress}
                      label={onDismiss.label}
                      handleClick={() => dismiss()}
                    ></TertiaryActionButton>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default Example;
