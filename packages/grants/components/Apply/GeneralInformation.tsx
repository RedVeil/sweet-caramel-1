import TextInput from "components/CommonComponents/TextInput";
import { isAddress } from "ethers/lib/utils";
import React from "react";
import inputExists, { isValidEmail } from "utils/isValidInput";
import CoverPhotoUpload from "./CoverPhotoUpload";
import ProfileImageUpload from "./ProfileImageUpload";

const GeneralInformation = ({ form, updateErrors }) => {
  const [formData, setFormData] = form;
  const updateInput = (value: string, formKey: string, errorObj): void => {
    setFormData({
      ...formData,
      [formKey]: {
        error: errorObj.error,
        errorMessage: errorObj.errorMessage,
        data: value,
      },
    });
  };
  const updateEmailInput = (value: string, formKey: string, errorObj): void => {
    setFormData({
      ...formData,
      links: {
        ...formData.links,
        [formKey]: {
          error: errorObj.error,
          errorMessage: errorObj.errorMessage,
          data: value,
        },
      },
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

  return (
    <div>
      {" "}
      <div className=" rounded-6xl p-10 mt-20 shadow-custom-lg">
        <h6 className=" font-semibold text-3xl text-center mb-12">General Information</h6>

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
            <label htmlFor="org-name" className="block text-lg font-semibold text-gray-900">
              Organization Name
            </label>
            <TextInput
              name="org-name"
              id="org-name"
              inputValue={formData.organizationName.data}
              isValid={inputExists}
              updateInput={updateInput}
              formKey={"organizationName"}
              inputDescription={"* The official company name of your non-profit organization"}
              errorMsg="Organization Name is Required"
            />
          </div>

          <div className="mb-10">
            <label htmlFor="eth-address" className="block text-lg font-semibold text-gray-900">
              Ethereum Address
            </label>
            <TextInput
              name="eth-address"
              id="eth-address"
              inputValue={formData.beneficiaryAddress.data}
              formKey={"beneficiaryAddress"}
              isValid={isAddress}
              updateInput={updateInput}
              inputDescription={"* The associated ETH address to receive fundings"}
              errorMsg="Your ETH Address is not valid"
            />
          </div>

          <div className="mb-10">
            <label htmlFor="title" className="block text-lg font-semibold text-gray-900">
              Title of Your Application
            </label>
            <TextInput
              name="title"
              id="title"
              inputValue={formData.projectName.data}
              formKey={"projectName"}
              isValid={inputExists}
              updateInput={updateInput}
              inputDescription={` * Use a few words to describe what your project is so that it catches your audience's attention`}
              errorMsg="Title of Application is Required"
            />
          </div>

          <div className="mb-10">
            <label htmlFor="category" className="block text-lg font-semibold text-gray-900">
              Proposal Category
            </label>
            <select
              id="category"
              name="category"
              className="mt-1 block w-full py-3 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.proposalCategory}
              onChange={(e) => updateSelectInput(e.target.value)}
            >
              <option className="health">Health</option>
              <option className="climate">Climate Change</option>
              <option className="poverty">Poverty Eradication</option>
            </select>
          </div>

          <div className="mb-10">
            <label htmlFor="mission" className="block text-lg font-semibold text-gray-900">
              Organization Mission
            </label>
            <TextInput
              name="mission"
              id="mission"
              type="textarea"
              inputValue={formData.missionStatement.data}
              formKey={"missionStatement"}
              isValid={inputExists}
              updateInput={updateInput}
              inputDescription={`* Must greater than 140 words`}
              errorMsg=" Organization Mission is Required"
            />
          </div>

          <div className="mb-10">
            <label htmlFor="email" className="block text-lg font-semibold text-gray-900">
              Email
            </label>
            <TextInput
              name="email"
              id="email"
              inputValue={formData.links.contactEmail.data}
              formKey={"contactEmail"}
              isValid={isValidEmail}
              updateInput={updateEmailInput}
              inputDescription={`* Please enter a valid email address`}
              errorMsg="Email Address is not valid"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="facebook" className="block text-lg font-semibold text-gray-900">
                Facebook
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm py-3">
                  http://
                </span>
                <TextInput
                  name="facebook"
                  id="facebook"
                  inputValue={formData.links.facebookUrl}
                  formKey={"facebookUrl"}
                  updateInput={updateLinksInput}
                  className="rounded-none rounded-r-md mt-0"
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label htmlFor="linkedin" className="block text-lg font-semibold text-gray-900">
                LinkedIn
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm py-3">
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
              <label htmlFor="twitter" className="block text-lg font-semibold text-gray-900">
                Twitter
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm py-3">
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
              <label htmlFor="instagram" className="block text-lg font-semibold text-gray-900">
                Instagram
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm py-3">
                  http://
                </span>
                <TextInput
                  name="instagram"
                  id="instagram"
                  inputValue={formData.links.instagramUrl}
                  formKey={"instagramUrl"}
                  updateInput={updateLinksInput}
                  className="rounded-none rounded-r-md mt-0"
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label htmlFor="github" className="block text-lg font-semibold text-gray-900">
                Github
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm py-3">
                  http://
                </span>
                <TextInput
                  name="github"
                  id="github"
                  inputValue={formData.links.githubUrl}
                  formKey={"githubUrl"}
                  updateInput={updateLinksInput}
                  className="rounded-none rounded-r-md mt-0"
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label htmlFor="website" className="block text-lg font-semibold text-gray-900">
                Website
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm py-3">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralInformation;
