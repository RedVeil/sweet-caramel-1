import { CameraIcon } from "@heroicons/react/outline";
import IPFSUploadFunc from "components/CommonComponents/IPFSUploadFunc";
import React from "react";
import styled from "styled-components";

interface CoverPhotoUploadProps {
  localState: string | string[];
  fileType: string;
  maxFileSizeMB?: number;
  numMaxFiles: number;
  setLocalState: (input: string | string[]) => void;
}

const CoverPhotoUpload: React.FC<CoverPhotoUploadProps> = (props) => {
  return (
    <IPFSUploadFunc {...props}>
      <CoverImg
        className=" bg-gray-100 rounded-2xl flex flex-col p-6 md:px-8 md:py-16 relative h-44 cursor-pointer"
        bgImage={`https://popcorn.mypinata.cloud/ipfs/${props.localState}`}
      >
        {!props.localState && (
          <>
            <p className="font-medium text-customPurple leading-[140%]">
              Upload a file <span className=" text-primaryDark font-normal">or drag and drop</span>
            </p>
            <p className="text-primaryDark pb-18 md:pb-0 leading-[140%]">PNG, JPG, GIF up to 10MB</p>
          </>
        )}
        <span className="bg-white border border-primary rounded-3xl px-6 py-3 text-primary font-medium hidden md:flex items-center gap-2 absolute right-6 bottom-5 cursor-pointer">
          <CameraIcon className="w-5 h-5" /> Cover
        </span>
      </CoverImg>
    </IPFSUploadFunc>
  );
};
interface CoverImgProps {
  bgImage: string;
}
const CoverImg = styled.div<CoverImgProps>`
  background-image: ${(props) => `url(${props.bgImage})` || ""};
  background-size: cover;
`;

export default CoverPhotoUpload;
