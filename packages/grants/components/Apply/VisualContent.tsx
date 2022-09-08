import { BeneficiaryApplication } from "@popcorn/hardhat";
import { AdditionalImages } from "@popcorn/hardhat/lib/adapters/BeneficiaryGovernance/BeneficiaryGovernanceAdapter";
import IPFSUploadFunc from "components/CommonComponents/IPFSUploadFunc";
import React from "react";
import VisualContentCard from "./VisualContentCard";

const VisualContent = ({
  form,
}: {
  form: [formData: BeneficiaryApplication, setFormData: React.Dispatch<BeneficiaryApplication>];
}) => {
  const [formData, setFormData] = form;

  const uploadAdditionalImages = (additionalImages: AdditionalImages[]): void => {
    setFormData({
      ...formData,
      files: {
        ...formData.files,
        additionalImages: formData.files.additionalImages.concat(additionalImages),
      },
    });
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      files: {
        ...formData.files,
        additionalImages: formData.files.additionalImages.filter((_image: AdditionalImages, i: number) => {
          return i !== index;
        }),
      },
    });
  };

  const updateImageDescription = (description: string, index: number): void => {
    const stateCopy = { ...formData };
    stateCopy.files.additionalImages[index].description = description;
    setFormData(stateCopy);
  };
  return (
    <div className=" rounded-6xl p-10 mt-20 shadow-custom-lg">
      <h6 className=" font-semibold text-3xl text-center mb-12">Visual Content</h6>

      <IPFSUploadFunc
        localState={formData?.files?.additionalImages}
        setLocalState={uploadAdditionalImages}
        fileType={"image/*,video/*"}
        numMaxFiles={4}
        maxFileSizeMB={15}
      >
        <form className="mt-10">
          <div>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-2xl">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-left">
                  <p className=" font-semibold text-blue-600">
                    {" "}
                    Upload a file <span className=" text-gray-500">or drag and drop</span>
                  </p>
                  <ul className=" list-disc">
                    <li className=" text-sm text-gray-400">High Resolution PNG, JPG, GIF up to 10MB</li>
                    <li className=" text-sm text-gray-400">Animated Gifs </li>
                    <li className=" text-sm text-gray-400">Videos (mp4, MOV) up to 15MB</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </IPFSUploadFunc>

      <div className="grid grid-cols-12 gap-5 mt-10">
        {formData?.files?.additionalImages?.map((image, i) => (
          <div className="col-span-3" key={image.hash}>
            <VisualContentCard
              {...image}
              index={i}
              removeImage={() => removeImage(i)}
              updateDescription={updateImageDescription}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualContent;
