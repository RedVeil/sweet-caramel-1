import { BeneficiaryApplication } from "@popcorn/hardhat";
import TextInput from "components/CommonComponents/TextInput";
import React from "react";
import inputExists from "utils/isValidInput";

const ProofsForm = ({
  form,
}: {
  form: [formData: BeneficiaryApplication, setFormData: React.Dispatch<BeneficiaryApplication>];
}) => {
  const [formData, setFormData] = form;
  const updateInput = (value: string, formKey: string): void => {
    setFormData({
      ...formData,
      links: {
        ...formData.links,
        [formKey]: value,
      },
    });
  };
  return (
    <div className=" rounded-lg px-6 py-10 md:p-10 mt-10 md:mt-20 border border-customLightGray">
      <h6 className="text-2xl md:text-3xl">Proof of Ownership</h6>

      <form className="mt-6 md:mt-14">
        <div>
          <label htmlFor="ownership-url" className="block  text-black leading-5 mb-2">
            Please share proof of ownership
          </label>
          <p className=" text-secondaryDark leading-4 mb-4">
            Share a URL on the beneficiary’s website or a tweet on the beneficiary’s official Twitter account that
            contains the Ethereum address shared in Step 1
          </p>
          <TextInput
            name="ownership-url"
            id="ownership-url"
            inputValue={formData.links.proofOfOwnership}
            isValid={inputExists}
            updateInput={updateInput}
            formKey={"proofOfOwnership"}
            inputDescription={"* URL reference containing ethereum address"}
          />
        </div>
      </form>
    </div>
  );
};

export default ProofsForm;
