import { BeneficiaryImage } from "@popcorn/hardhat";
import {
  AdditionalImages,
  ImpactReport,
} from "@popcorn/hardhat/lib/adapters/BeneficiaryGovernance/BeneficiaryGovernanceAdapter";
import { IpfsClient, UploadResult } from "@popcorn/utils";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

const uploadError = (errMsg: string) => toast.error(errMsg);
const isSuccessfulUpload = (res: UploadResult): boolean => res.status >= 200 && res.status < 300;
const isFailedUpload = (res: UploadResult): boolean => res.status !== 200;

interface IPFSUploadFuncProps {
  localState: string | string[] | ImpactReport[] | BeneficiaryImage[] | AdditionalImages[];
  fileType: string;
  maxFileSizeMB?: number;
  numMaxFiles: number;
  setLocalState: (
    input: string | string[] | UploadResult[] | ImpactReport[] | BeneficiaryImage[] | AdditionalImages[],
  ) => void;
  children: JSX.Element | JSX.Element[];
}

const isValidFileSize = (file: File, maxFileSizeMB: number) => {
  const maxFileSizeBytes = maxFileSizeMB * 1000 * 1024;
  if (file.size > maxFileSizeBytes) {
    uploadError(`File size is greater than ${maxFileSizeMB}mb limit`);
    return {
      code: "file-too-large",
      message: `File is larger than ${maxFileSizeMB} MB`,
    };
  }
  return null;
};

const uploadSingleFile = async (
  files: File[],
  setVideo: (input: string | string[]) => void,
  setUploadProgress?: React.Dispatch<React.SetStateAction<number>>,
) => {
  toast.loading("Uploading");
  const res = await IpfsClient.upload(files[0], setUploadProgress);
  if (isSuccessfulUpload(res)) {
    setVideo(res.hash);
    toast.dismiss();
    toast.success("Successful upload to IPFS");
  } else {
    toast.dismiss();
    uploadError(`Upload was unsuccessful with status ${res.status}. ${res.errorDetails}`);
  }
};

const uploadMultipleFiles = async (files: File[], setLocalState: (input: UploadResult[]) => void, fileType: string) => {
  toast.loading("Uploading");
  const uploadResults = await Promise.all(
    files.map((file) => {
      return IpfsClient.upload(file);
    }),
  );
  if (uploadResults.every(isSuccessfulUpload)) {
    setLocalState(uploadResults.map((result) => result));
    toast.dismiss();
    toast.success(`${fileType === "image/*" ? "Images" : "Files"} successfully uploaded to IPFS`);
  } else if (uploadResults.every(isFailedUpload)) {
    toast.dismiss();
    uploadError(
      `Uploads were unsuccessful with status ${uploadResults[0].status}: 
			${uploadResults[0].errorDetails}`,
    );
  } else {
    const successfulUploads = uploadResults.filter(isSuccessfulUpload);
    const unsuccessfulUploads = uploadResults.filter(isFailedUpload);
    setLocalState(successfulUploads.map((result) => result));
    toast.success(
      `${successfulUploads.length} ${fileType === "image/*" ? "images" : "files"} were successfully upload to IPFS`,
    );
    uploadError(
      `${successfulUploads.length} ${fileType === "image/*" ? "images" : "files"} were unsuccessfully uploaded to IPFS 
			with status ${unsuccessfulUploads[0].status}: ${unsuccessfulUploads[0].errorDetails}`,
    );
  }
};

const IPFSUploadFunc: React.FC<IPFSUploadFuncProps> = ({
  localState,
  fileType,
  numMaxFiles,
  maxFileSizeMB,
  setLocalState,
  children,
}) => {
  const [_uploadProgress, setUploadProgress] = useState<number>(0); // TODO Actually use uploadProgress

  useEffect(() => {
    if (localState) {
      setUploadProgress(0);
    }
  }, [localState]);

  const { fileRejections, getRootProps, getInputProps } = useDropzone({
    accept: fileType,
    multiple: numMaxFiles !== 1,
    maxFiles: numMaxFiles,
    validator: (file: File) => {
      return maxFileSizeMB ? isValidFileSize(file, maxFileSizeMB) : null;
    },
    onDrop: (acceptedFiles) => {
      if (fileRejections.length) {
        toast.error(`Maximum number of files to be uploaded is ${numMaxFiles}`);
      } else {
        if (numMaxFiles === 1) {
          uploadSingleFile(acceptedFiles, setLocalState);
        } else {
          uploadMultipleFiles(acceptedFiles, setLocalState, fileType);
        }
      }
    },
  });
  const rootProps = getRootProps();
  return (
    <div {...rootProps} className="w-full">
      <input {...getInputProps()} />
      {children}
    </div>
  );
};

export default IPFSUploadFunc;
