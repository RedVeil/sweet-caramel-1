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
    <div className=" rounded-6xl p-10 mt-20 shadow-custom-lg">
      <h6 className=" font-semibold text-3xl text-center mb-12">Proof of Ownership</h6>

      <form className="mt-20">
        <div>
          <label htmlFor="ownership-url" className="block text-lg font-semibold text-gray-900">
            Please share proof of ownership
          </label>
          <p className=" text-gray-500">
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
