import React, { useContext } from "react";
import { store } from "../../context/store";
import DualActionWideModal from "./DualActionWideModal";

export const DualActionWideModalContainer: React.FC = () => {
  const {
    state: {
      dualActionWideModal: { visible, title, content, progress, onDismiss, onConfirm, image },
    },
  } = useContext(store);
  return (
    <DualActionWideModal
      visible={visible}
      title={title}
      content={content}
      progress={progress}
      onDismiss={onDismiss}
      onConfirm={onConfirm}
      image={image}
    />
  );
};
export default DualActionWideModalContainer;
