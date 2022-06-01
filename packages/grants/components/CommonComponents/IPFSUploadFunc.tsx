import { IpfsClient, UploadResult } from "@popcorn/utils";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import * as SVGLoaders from "svg-loaders-react";

const success = (msg: string) => toast.success(msg);

const uploadError = (errMsg: string) => toast.error(errMsg);
const isSuccessfulUpload = (res: UploadResult): boolean => res.status === 200;
const isFailedUpload = (res: UploadResult): boolean => res.status !== 200;

interface IPFSUploadFuncProps {
  localState: string | string[];
  fileType: string;
  maxFileSizeMB?: number;
  numMaxFiles: number;
  setLocalState: (input: string | string[]) => void;
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

const showUploadBox = (numMaxFiles: number, localState: string | string[]): boolean => {
  if (typeof localState === "string") return localState === "";
  return localState.length < numMaxFiles || numMaxFiles === 0;
};

const Spinner = () => {
  return <SVGLoaders.Oval stroke="#ffffff" className="mx-auto my-4 h-10 w-10" />;
};

const IPFSUploadFunc: React.FC<IPFSUploadFuncProps> = ({
  localState,
  fileType,
  numMaxFiles,
  maxFileSizeMB,
  setLocalState,
  children,
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (localState || localState.length > 0) {
      setUploadProgress(0);
    }
  }, [localState]);

  const uploadSingleFile = async (
    files: File[],
    setVideo: (input: string | string[]) => void,
    setUploadProgress?: (progress: number) => void,
  ) => {
    setLoading(true);
    const res = await IpfsClient.upload(files[0], setUploadProgress);
    if (isSuccessfulUpload(res)) {
      setVideo(res.hash);
      toast.dismiss();
      success("Successful upload to IPFS");
    } else {
      toast.dismiss();
      uploadError(`Upload was unsuccessful with status ${res.status}. ${res.errorDetails}`);
    }
    setLoading(false);
  };

  const { acceptedFiles, fileRejections, getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
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
          if (numMaxFiles === 1 && fileType === "image/*") {
            uploadSingleFile(acceptedFiles, setLocalState);
          } else if (fileType === "video/*") {
            uploadSingleFile(acceptedFiles, setLocalState, setUploadProgress);
          }
        }
        setFiles(
          acceptedFiles.map((file) =>
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            }),
          ),
        );
      },
    });
  const rootProps = getRootProps() as any;
  return (
    <div {...rootProps} className="w-full">
      {loading && (
        <div className="absolute transform left-1/2 -translate-x-1/2 z-50">
          <Spinner />
        </div>
      )}
      <input {...getInputProps()} />
      {children}
    </div>
  );
};

export default IPFSUploadFunc;
