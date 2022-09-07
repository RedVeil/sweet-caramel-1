import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import React, { useContext } from "react";

export interface InfoIconWithModalProps {
  title: string;
  content?: string | React.ReactElement;
  children?: React.ReactElement;
  image?: React.ReactElement;
  size?: string;
}

export const InfoIconWithModal: React.FC<InfoIconWithModalProps> = ({
  title,
  content,
  children,
  size = "h-5 w-5",
  image,
}) => {
  const { dispatch } = useContext(store);

  return (
    <img
      src="/images/icons/tooltip.svg"
      onClick={() => {
        dispatch(
          setSingleActionModal({
            title,
            children,
            content,
            image,
            onDismiss: {
              label: "Dismiss",
              onClick: () => {
                dispatch(setSingleActionModal(false));
              },
            },
          }),
        );
      }}
      className={`ml-1 cursor-pointer ${size}`}
    />
  );
};
