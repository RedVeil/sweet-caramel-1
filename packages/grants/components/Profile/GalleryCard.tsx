import { ShareIcon } from "@heroicons/react/outline";
import SocialShare from "components/CommonComponents/SocialShare";
import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import React, { useContext } from "react";
import styled from "styled-components";
interface GalleryCardProps {
  size: string;
  image: string;
  description: string;
  fileName: string;
}
const GalleryCard: React.FC<GalleryCardProps> = ({ size, image, description, fileName }) => {
  const { dispatch } = useContext(store);

  const shareImage = () => {
    dispatch(
      setSingleActionModal({
        content: `Share this profile to anyone and help to promote this impact project.`,
        title: "Share & Spread Awareness",
        visible: true,
        image: <img src="/images/shareModal.svg" />,
        onDismiss: {
          onClick: () => dispatch(setSingleActionModal({ visible: false })),
        },
        children: <SocialShare url={`${process.env.IPFS_URL}${image}`} title="Share this Image" text="" />,
      }),
    );
  };

  return (
    <Card size={size}>
      <div className="relative md:min-h-5/6 flex-grow">
        {fileName?.includes(".mp4") || fileName?.includes(".mov") ? (
          <video
            src={`${process.env.IPFS_URL}${image}`}
            className="h-full w-full object-cover rounded-4xl"
            controls
          ></video>
        ) : (
          <img src={`${process.env.IPFS_URL}${image}`} alt="" className="h-full w-full object-cover rounded-4xl" />
        )}
        <button
          onClick={shareImage}
          className=" opacity-80 bg-white border-gray-200 rounded-full text-gray-900 flex justify-center items-center absolute right-5 bottom-5 shadow-white-button w-12 h-12"
        >
          <ShareIcon className="w-5 h-5" />
        </button>
      </div>
      {description && <p className="mt-4">{description}</p>}
    </Card>
  );
};

interface CardProps {
  size: string;
}
const Card = styled.div<CardProps>`
  margin: 0px 0px 30px;
  padding: 0;
  border-radius: 8px;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 256px;
  @media screen and (min-width: 768px) {
    margin: 10px 20px;
    height: auto;
    grid-row-end: ${({ size }) => (size == "small" ? "span 35" : size == "medium" ? "span 50" : "span 65")};
  }
`;
export default GalleryCard;
