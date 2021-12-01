import { setSingleActionModal } from 'context/actions';
import { store } from 'context/store';
import React, { useContext } from 'react';
import * as Icon from 'react-feather';

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
    <Icon.Info
      onClick={() => {
        dispatch(
          setSingleActionModal({
            title,
            content: content || children,
            onConfirm: {
              label: 'OK',
              onClick: () => {
                dispatch(setSingleActionModal(false));
              },
            },
          }),
        );
      }}
      className={`ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${size}`}
    />
  );
};
