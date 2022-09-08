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
        className=" bg-gray-100 rounded-2xl flex flex-col justify-center items-center py-16 relative h-44"
        bgImage={`https://popcorn.mypinata.cloud/ipfs/${props.localState}`}
      >
        {!props.localState && (
          <>
            <p className=" font-semibold text-blue-600">
              Upload a file <span className=" text-gray-600">or drag and drop</span>
            </p>
            <p className="text-gray-500 pb-18 md:pb-0">PNG, JPG, GIF up to 10MB</p>
          </>
        )}
        <span className="bg-white border border-gray-200 rounded-3xl px-6 py-3 text-blue-600 font-semibold flex items-center gap-2 absolute right-5 bottom-5">
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
