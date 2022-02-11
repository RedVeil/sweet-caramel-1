import { setSingleActionModal } from 'context/actions';
import { store } from 'context/store';
import React, { useContext } from 'react';

export interface InfoIconWithModalProps {
  title: string;
  content?: string;
  children?: React.ReactElement;
  size?: string;
}

export const InfoIconWithModal: React.FC<InfoIconWithModalProps> = ({
  title,
  content,
  children,
  size = 'h-7 w-7',
}) => {
  const { dispatch } = useContext(store);

  return (
    <img
      src="/images/infoIcon.svg"
      onClick={() => {
        dispatch(
          setSingleActionModal({
            title,
            children: children,
            content: content,
            onDismiss: {
              label: 'Dismiss',
              onClick: () => {
                dispatch(setSingleActionModal(false));
              },
            },
          }),
        );
      }}
      className={`ml-1 inline-flex items-center p-1 -mb-0.5 border border-transparent rounded-full shadow-sm text-gray-500 hover:bg-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${size}`}
    />
  );
};
