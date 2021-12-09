import MainActionButton from 'components/MainActionButton';
import React from 'react';

export interface SingleActionModalProps {
  title: string;
  children?: React.ReactElement;
  content?: string;
  visible: boolean;
  type?: 'info' | 'error';
  image?: React.ReactElement;
  onConfirm: { label: string; onClick: Function };
}
export const DefaultSingleActionModalProps: SingleActionModalProps = {
  content: '',
  title: '',
  visible: false,
  type: 'info',
  onConfirm: { label: '', onClick: () => {} },
};

export const SingleActionModal: React.FC<SingleActionModalProps> = ({
  title,
  type,
  visible,
  children,
  content,
  image,
  onConfirm,
}) => {
  if (!visible) return <></>;
  return (
    <div
      className="fixed z-20 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-4xl px-5 pt-6 pb-5 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
          <div>
            {image ? (
              <>{image}</>
            ) : (
              <>
                {(type && type == 'error' && (
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
                )) || (
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg
                      className="h-6 w-6 text-green-600"
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </>
            )}
            <div className="mt-3 text-center sm:mt-5">
              <h3
                className="text-2xl leading-6 font-semibold text-gray-900"
                id="modal-title"
              >
                {title}
              </h3>
              <div className="mt-2">
                {children ? (
                  children
                ) : (
                  <p className="text-sm text-gray-500">{content}</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <div>
              <MainActionButton
                label={onConfirm.label}
                handleClick={() => onConfirm.onClick && onConfirm.onClick()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SingleActionModal;
