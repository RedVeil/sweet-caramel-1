import { CameraIcon } from "@heroicons/react/outline";
import IPFSUploadFunc from "components/CommonComponents/IPFSUploadFunc";
import AvatarIcon from "components/Svgs/AvatarIcon";
import React from "react";

interface ProfileImageUploadProps {
  localState: string | string[];
  fileType: string;
  maxFileSizeMB?: number;
  numMaxFiles: number;
  setLocalState: (input: string | string[]) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = (props) => {
  return (
    <IPFSUploadFunc {...props}>
      <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 top-24 md:top-28">
        <div className="relative">
          {!props.localState ? (
            <AvatarIcon />
          ) : (
            <img
              src={`https://popcorn.mypinata.cloud/ipfs/${props.localState}`}
              alt=""
              className=" w-32 h-32 rounded-full object-cover"
            />
          )}
          <div
            className="bg-white w-11 h-11 rounded-full border border-gray-200 flex justify-center items-center absolute left-20 top-20"
            style={{ boxShadow: "0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
          >
            <CameraIcon className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>
    </IPFSUploadFunc>
  );
};

export default ProfileImageUpload;
