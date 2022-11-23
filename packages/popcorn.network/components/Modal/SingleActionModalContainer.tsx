import React, { useContext } from "react";
import SingleActionModal from "./SingleActionModal";
import { store } from "app/store";

export const SingleActionModalContainer: React.FC = () => {

  const { state: { singleActionModal }  } = useContext(store);
  return <SingleActionModal 
    visible={singleActionModal.visible}
    title={singleActionModal.title}
    content={singleActionModal.content}
    children={singleActionModal.children}
    image={singleActionModal.image}
    type={singleActionModal.type}
    onDismiss={singleActionModal.onDismiss}
    onConfirm={singleActionModal.onConfirm}
    keepOpen={singleActionModal.keepOpen}
    isTerms={singleActionModal.isTerms}
  />

}
