import { PaperClipIcon } from "@heroicons/react/solid";
import { BeneficiaryApplication, ImpactReport } from "helper/types";
import IPFSUploadFunc from "components/CommonComponents/IPFSUploadFunc";
import React from "react";

const ImpactReports = ({
  form,
}: {
  form: [formData: BeneficiaryApplication, setFormData: React.Dispatch<BeneficiaryApplication>];
}) => {
  const [formData, setFormData] = form;

  const uploadImpactReports = (impactReports: ImpactReport[]): void => {
    let newReports = impactReports.map((impactReport) => impactReport);
    setFormData({
      ...formData,
      files: {
        ...formData.files,
        impactReports: formData.files.impactReports.concat(newReports),
      },
    });
  };

  const removeImpactReport = (index: number) => {
    setFormData({
      ...formData,
      files: {
        ...formData.files,
        impactReports: formData.files.impactReports.filter((_impactReport, i) => {
          return i !== index;
        }),
      },
    });
  };
  return (
    <>
      <h6 className="text-2xl md:text-3xl">Impact Reports</h6>

      <form className="mt-6 md:mt-14">
        <div>
          <label htmlFor="impact-reports" className="block  text-black leading-5 mb-2">
            You’re welcome to upload 4 recent impact reports from your organization
          </label>
          <div className="mt-1 relative">
            <div className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-3 px-3">
              <IPFSUploadFunc
                localState={formData?.files?.impactReports}
                setLocalState={uploadImpactReports}
                fileType={"image/*"}
                numMaxFiles={4}
                maxFileSizeMB={10}
              >
                <p className=" text-gray-900">Upload Files</p>
              </IPFSUploadFunc>
            </div>
          </div>
          <p className="mt-2 text-sm text-secondaryDark">
            * Files can be in PDF or JPG format. All documents submitted must be in English or has English as a
            translated version.
          </p>
        </div>
      </form>
      {formData?.files?.impactReports.map(({ fileName, hash }, i) => (
        <div className="border border-gray-200 rounded-lg flex justify-between py-3 px-4 items-center my-4" key={hash}>
          <div className="flex gap-2">
            <div>
              <PaperClipIcon className="h-5 w-5 text-gray-400" />
            </div>
            <a
              className="text-black w-40 md:w-full text-ellipsis whitespace-nowrap overflow-hidden"
              href={`https://popcorn.mypinata.cloud/ipfs/${hash}`}
            >
              {fileName}
            </a>
          </div>
          <button className="text-primary text-sm" onClick={() => removeImpactReport(i)}>
            Delete
          </button>
        </div>
      ))}
    </>
  );
};

export default ImpactReports;
