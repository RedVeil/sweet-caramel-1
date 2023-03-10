import React, { useContext } from "react";
import { store } from "@popcorn/components/context/store";
import DualActionWideModal from "@popcorn/components/components/Modal/DualActionWideModal";

export const DualActionWideModalContainer: React.FC = () => {
  const {
    state: {
      dualActionWideModal: { visible, title, content, progress, onDismiss, onConfirm, image, keepOpen },
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
      keepOpen={keepOpen}
    />
  );
};
export default DualActionWideModalContainer;
