import NotFoundError from "components/CommonComponents/NotFoundError";
import React from "react";
import styled from "styled-components";
import GalleryCard from "./GalleryCard";

interface GalleryTabProps {
  additionalImages: Array<{
    hash: string;
    description: string;
    fileName: string;
    image?: string;
  }>;
  rowsPercent: number;
}

const GalleryTab: React.FC<GalleryTabProps> = ({ additionalImages, rowsPercent }) => {
  const setImageSize = (hash: string) => {
    let arr = ["small", "large", "medium"];
    let rand = Math.floor(Math.random() * arr.length) + 1;
    let imgSize = arr[rand - 1];
    // const img = document.createElement("img");
    // img.setAttribute("src", `${process.env.IPFS_URL}${hash}`);
    // img.style.objectFit = "cover";

    // let imgSize: string;
    // let imgHeight = img.naturalHeight;
    // let imgWidth = img.naturalWidth;
    // if (imgHeight > imgWidth) {
    // 	imgSize = "large";
    // } else if (imgWidth - imgHeight <= 300) {
    // 	imgSize = "medium";
    // } else {
    // 	imgSize = "small";
    // }
    return imgSize;
  };
  return (
    <>
      {/* {hash || image} */}
      {additionalImages.length > 0 ? (
        <GalleryLayout rowsPercent={rowsPercent}>
          {additionalImages?.map(({ hash, description, fileName, image }) => (
            <GalleryCard
              size={setImageSize(hash)}
              image={hash || image}
              description={description}
              key={hash}
              fileName={fileName}
            />
          ))}
        </GalleryLayout>
      ) : (
        <NotFoundError image="/images/emptygallery.svg" title="No Photos Available">
          <p className="text-gray-700">The organization has no photos.</p>
        </NotFoundError>
      )}{" "}
    </>
  );
};
interface GalleryLayoutProps {
  rowsPercent: number;
}
const GalleryLayout = styled.div<GalleryLayoutProps>`
  margin: 0;
  padding: 0;
  width: 100%;
  @media screen and (min-width: 768px) {
    display: grid;
    grid-template-columns: ${({ rowsPercent }) => `repeat(auto-fill, ${rowsPercent}%)`};
    grid-auto-rows: 10px;
    justify-content: center;
  }
`;
export default GalleryTab;
