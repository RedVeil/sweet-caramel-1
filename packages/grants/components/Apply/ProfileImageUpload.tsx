import { CameraIcon } from "@heroicons/react/outline";
import IPFSUploadFunc from "components/CommonComponents/IPFSUploadFunc";
import AvatarIcon from "components/Svgs/AvatarIcon";
import React, { useEffect, useState } from "react";

interface ProfileImageUploadProps {
  localState: string | string[];
  fileType: string;
  maxFileSizeMB?: number;
  numMaxFiles: number;
  setLocalState: (input: string | string[]) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = (props) => {
  const [size, setSize] = useState<number>(120);
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSize(88);
    }
  }, []);
  return (
    <IPFSUploadFunc {...props}>
      <div className="absolute left-5 md:left-1/2 transform md:-translate-x-1/2 top-32 md:top-28 cursor-pointer">
        <div className="relative">
          {!props.localState ? (
            <AvatarIcon size={size} />
          ) : (
            <img
              src={`https://popcorn.mypinata.cloud/ipfs/${props.localState}`}
              alt=""
              className="rounded-full object-cover"
              width={size}
              height={size}
            />
          )}
          <div className="bg-white w-11 h-11 rounded-full border border-primary flex justify-center items-center absolute left-14 top-14 md:left-20 md:top-20">
            <CameraIcon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </IPFSUploadFunc>
  );
};

export default ProfileImageUpload;
