import { TrashIcon } from "@heroicons/react/outline";
import React from "react";
interface VisualContentCardProps {
  fileName?: string;
  fileSize?: number;
  description?: string;
  hash?: string;
  index: number;
  removeImage: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
  updateDescription: (description: string, index: number) => void;
}
const convertToKB = (bytes: number) => {
  return Math.round(bytes * 0.001);
};
const VisualContentCard: React.FC<VisualContentCardProps> = ({
  fileName,
  fileSize,
  description,
  hash,
  removeImage,
  updateDescription,
  index,
}) => {
  return (
    <div>
      {fileName.includes(".mp4") || fileName.includes(".mov") ? (
        <video
          src={`https://popcorn.mypinata.cloud/ipfs/${hash}`}
          className=" h-60 rounded-lg w-full mb-3 object-cover"
          controls
        ></video>
      ) : (
        <img
          src={`https://popcorn.mypinata.cloud/ipfs/${hash}`}
          alt=""
          className=" h-60 rounded-lg w-full mb-3 object-cover"
        />
      )}
      <div className="grid grid-cols-3">
        <div className="col-span-2">
          <p className=" text-black leading-5 w-full text-ellipsis whitespace-nowrap overflow-hidden">{fileName}</p>
        </div>
        <div className="col-span-1 flex justify-end cursor-pointer">
          <TrashIcon className=" w-6 h-6 text-gray-400" onClick={removeImage} />
        </div>
      </div>
      <p className="text-primaryDark leading-4 mb-5">{fileSize ? `${convertToKB(fileSize)}kb` : "-"}</p>
      <input
        type="text"
        name={`description-${hash}`}
        id={`description-${hash}`}
        value={description}
        placeholder="Type description here.."
        className=" border-gray-300 rounded placeholder:text-primaryDark text-black w-full"
        onChange={(e) => updateDescription(e.target.value, index)}
      />
    </div>
  );
};

export default VisualContentCard;
