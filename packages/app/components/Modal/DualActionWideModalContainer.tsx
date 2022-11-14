import DualActionWideModal from "@popcorn/app/components/Modal/DualActionWideModal";
import { store } from "@popcorn/app/context/store";
import React, { useContext } from "react";

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
