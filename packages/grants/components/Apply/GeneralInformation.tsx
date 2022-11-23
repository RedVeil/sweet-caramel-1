import { BeneficiaryApplication } from "helper/types";
import { filterValues } from "components/Beneficiaries/BeneficiaryFilter";
import CustomDropdown from "components/CommonComponents/CustomDropdown";
import TextInput from "components/CommonComponents/TextInput";
import { isAddress } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import inputExists, { isValidEmail } from "utils/isValidInput";
import CoverPhotoUpload from "./CoverPhotoUpload";
import ProfileImageUpload from "./ProfileImageUpload";

const filterList = [
  {
    id: "1",
    value: filterValues.environment,
  },
  {
    id: "2",
    value: filterValues.education,
  },
  {
    id: "3",
    value: filterValues.inequality,
  },
  {
    id: "4",
    value: filterValues.openSource,
  },
];

interface GeneralInformationProps {
  form: [formData: BeneficiaryApplication, setFormData: React.Dispatch<BeneficiaryApplication>];
  isEdit?: boolean;
}

const GeneralInformation: React.FC<GeneralInformationProps> = ({ form, isEdit = false }) => {
  const [formData, setFormData] = form;
  const updateInput = (value: string, formKey: string): void => {
    setFormData({
      ...formData,
      [formKey]: value,
    });
  };
  const updateLinksInput = (value: string, formKey: string): void => {
    setFormData({ ...formData, links: { ...formData.links, [formKey]: value } });
  };
  const updateSelectInput = (value: string): void => {
    setFormData({ ...formData, proposalCategory: value });
  };
  const updateProfileImage = (image: string): void => {
    setFormData({
      ...formData,
      files: {
        ...formData.files,
        profileImage: {
          image,
          description: formData?.files?.profileImage?.description,
        },
      },
    });
  };

  const updateHeaderImage = (image: string): void => {
    setFormData({
      ...formData,
      files: {
        ...formData.files,
        headerImage: {
          image,
          description: formData?.files?.headerImage?.description,
        },
      },
    });
  };

  useEffect(() => {
    if (!formData.proposalCategory) {
      updateSelectInput(filterValues.environment);
    }
  }, []);

  const [categoryFilter, setCategoryFilter] = useState<{ id: string; value: string }>({ id: "1", value: "All" });
  const switchFilter = (value: { id: string; value: string }) => {
    setCategoryFilter(value);
    updateSelectInput(value.value);
  };
  return (
    <>
      <h6 className="text-2xl md:text-3xl mb-6 md:mb-12">General Information</h6>

      <div className="relative">
        <CoverPhotoUpload
          localState={formData?.files?.headerImage?.image}
          setLocalState={updateHeaderImage}
          fileType={"image/*"}
          numMaxFiles={1}
          maxFileSizeMB={10}
        />
        <ProfileImageUpload
          localState={formData?.files?.profileImage?.image}
          setLocalState={updateProfileImage}
          fileType={"image/*"}
          numMaxFiles={1}
          maxFileSizeMB={10}
        />
      </div>

      <form className="mt-32">
        <div className="mb-10">
          <label htmlFor="org-name" className="block  text-black leading-5">
            Organization Name
          </label>
          <TextInput
            name="org-name"
            id="org-name"
            inputValue={formData.organizationName}
            isValid={inputExists}
            updateInput={updateInput}
            formKey={"organizationName"}
            inputDescription={"* The official company name of your non-profit organization"}
            disabled={isEdit}
          />
        </div>

        <div className="mb-10">
          <label htmlFor="eth-address" className="block  text-black leading-5">
            Ethereum Address
          </label>
          <TextInput
            name="eth-address"
            id="eth-address"
            inputValue={formData.beneficiaryAddress}
            formKey={"beneficiaryAddress"}
            isValid={isAddress}
            updateInput={updateInput}
            inputDescription={"* The associated ETH address to receive fundings"}
            disabled={isEdit}
          />
        </div>

        <div className="mb-10">
          <label htmlFor="title" className="block  text-black leading-5">
            Title of Your Application
          </label>
          <TextInput
            name="title"
            id="title"
            inputValue={formData.projectName}
            formKey={"projectName"}
            isValid={inputExists}
            updateInput={updateInput}
            inputDescription={` * Use a few words to describe what your project is so that it catches your audience's attention`}
          />
        </div>

        <div className="mb-10">
          <label htmlFor="category" className="block  text-black leading-5">
            Proposal Category
          </label>
          <CustomDropdown
            categoryFilter={categoryFilter}
            switchFilter={switchFilter}
            categories={filterList}
          ></CustomDropdown>
        </div>

        <div className="mb-10">
          <label htmlFor="mission" className="block  text-black leading-5">
            Organization Mission
          </label>
          <TextInput
            name="mission"
            id="mission"
            type="textarea"
            inputValue={formData.missionStatement}
            formKey={"missionStatement"}
            isValid={inputExists}
            updateInput={updateInput}
            inputDescription={`* Must greater than 140 words`}
          />
        </div>

        <div className="mb-10">
          <label htmlFor="email" className="block  text-black leading-5">
            Email
          </label>
          <TextInput
            name="email"
            id="email"
            inputValue={formData.links.contactEmail}
            formKey={"contactEmail"}
            isValid={isValidEmail}
            updateInput={updateLinksInput}
            inputDescription={`* Please enter a valid email address`}
          />
        </div>

        <div className="mb-10">
          <label htmlFor="website" className="block  text-black leading-5">
            Website
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-customLightGray bg-opacity-20 text-secondaryDark text-sm py-3">
              http://
            </span>
            <TextInput
              name="website"
              id="website"
              inputValue={formData.links.website}
              formKey={"website"}
              updateInput={updateLinksInput}
              className="rounded-none rounded-r-md mt-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="linkedin" className="block  text-black leading-5">
              LinkedIn
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-customLightGray bg-opacity-20 text-secondaryDark text-sm py-3">
                http://
              </span>
              <TextInput
                name="linkedin"
                id="linkedin"
                inputValue={formData.links.linkedinUrl}
                formKey={"linkedinUrl"}
                updateInput={updateLinksInput}
                className="rounded-none rounded-r-md mt-0"
              />
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label htmlFor="twitter" className="block  text-black leading-5">
              Twitter
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-customLightGray bg-opacity-20 text-secondaryDark text-sm py-3">
                http://
              </span>
              <TextInput
                name="twitter"
                id="twitter"
                inputValue={formData.links.twitterUrl}
                formKey={"twitterUrl"}
                updateInput={updateLinksInput}
                className="rounded-none rounded-r-md mt-0"
              />
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label htmlFor="instagram" className="block  text-black leading-5">
              Telegram
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-customLightGray bg-opacity-20 text-secondaryDark text-sm py-3">
                http://
              </span>
              <TextInput
                name="telegram"
                id="telegram"
                inputValue={formData.links.telegramUrl}
                formKey={"telegramUrl"}
                updateInput={updateLinksInput}
                className="rounded-none rounded-r-md mt-0"
              />
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label htmlFor="github" className="block  text-black leading-5">
              Signal
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-customLightGray bg-opacity-20 text-secondaryDark text-sm py-3">
                http://
              </span>
              <TextInput
                name="signal"
                id="signal"
                inputValue={formData.links.signalUrl}
                formKey={"signalUrl"}
                updateInput={updateLinksInput}
                className="rounded-none rounded-r-md mt-0"
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default GeneralInformation;
