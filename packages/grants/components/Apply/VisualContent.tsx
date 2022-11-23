import { BeneficiaryApplication } from "helper/types";
import IPFSUploadFunc from "components/CommonComponents/IPFSUploadFunc";
import React from "react";
import VisualContentCard from "./VisualContentCard";
import { Image } from "helper/types";

const VisualContent = ({
  form,
}: {
  form: [formData: BeneficiaryApplication, setFormData: React.Dispatch<BeneficiaryApplication>];
}) => {
  const [formData, setFormData] = form;

  const uploadAdditionalImages = (additionalImages: Image[]): void => {
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
        additionalImages: formData.files.additionalImages.filter((_image: Image, i: number) => {
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
    <>
      <h6 className="text-2xl md:text-3xl">Visual Content</h6>

      <IPFSUploadFunc
        localState={formData?.files?.additionalImages}
        setLocalState={uploadAdditionalImages}
        fileType={"image/*,video/*"}
        numMaxFiles={4}
        maxFileSizeMB={15}
      >
        <form className="mt-6 md:mt-10">
          <div>
            <div className="mt-1 flex flex-col md:flex-row md:justify-between md:items-center p-6 md:p-14 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="text-left order-2 md:order-1">
                <p className="text-customPurple">
                  {" "}
                  Upload a file <span className=" text-primaryDark">or drag and drop</span>
                </p>
                <ul className="pl-4 list-disc">
                  <li className=" text-secondaryDark">High Resolution PNG, JPG, GIF up to 10MB</li>
                  <li className=" text-secondaryDark">Animated Gifs </li>
                  <li className=" text-secondaryDark">Videos (mp4, MOV) up to 15MB</li>
                </ul>
              </div>
              <svg
                className="h-12 w-12 text-gray-400 order-1 md:order-2"
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
            </div>
          </div>
        </form>
      </IPFSUploadFunc>

      <div className="grid grid-cols-12 gap-5 mt-10">
        {formData?.files?.additionalImages?.map((image, i) => (
          <div className="col-span-12 md:col-span-3" key={image.hash}>
            <VisualContentCard
              {...image}
              index={i}
              removeImage={() => removeImage(i)}
              updateDescription={updateImageDescription}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default VisualContent;
