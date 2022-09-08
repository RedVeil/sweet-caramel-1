/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/outline";
import Button from "components/CommonComponents/Button";
import React, { Fragment, useEffect, useRef, useState } from "react";

export interface DualActionWideModalProps {
  title: string;
  content: React.ReactElement | string;
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
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-filter backdrop-blur" />
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
            <div className="inline-block align-bottom bg-white rounded-4xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8">
              <div>
                {image ? (
                  <>{image}</>
                ) : (
                  <>
                    {icon == "check" && (
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                      </div>
                    )}
                  </>
                )}
                <div className="mt-3 text-center sm:mt-5">
                  <Dialog.Title as="h3" className="text-2xl leading-6 font-semibold text-gray-900">
                    {title}
                  </Dialog.Title>
                  <div className="mt-2">
                    {typeof content === "string" ? (
                      <p className="text-lg text-gray-500 py-6">{content}</p>
                    ) : (
                      <>{content}</>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-4 sm:grid-flow-row-dense">
                {onConfirm && (
                  <Button variant="primary" onClick={() => confirm()} className="py-3 px-5">
                    {onConfirm.label}
                  </Button>
                )}
                {onDismiss && (
                  <Button variant="secondary" onClick={() => dismiss()} className="py-3 px-5">
                    {onDismiss.label}
                  </Button>
                )}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default Example;
