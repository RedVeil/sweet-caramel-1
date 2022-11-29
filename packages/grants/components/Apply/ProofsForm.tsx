import { BeneficiaryApplication } from "helper/types";
import TextInput from "components/CommonComponents/TextInput";
import React from "react";
import inputExists from "utils/isValidInput";

interface ProofProps {
  form: [formData: BeneficiaryApplication, setFormData: React.Dispatch<BeneficiaryApplication>];
  isEdit?: boolean;
}

const ProofsForm: React.FC<ProofProps> = ({ form, isEdit = false }) => {
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
    <>
      <h6 className="text-2xl md:text-3xl">Proof of Ownership</h6>

      <form className="mt-6 md:mt-14">
        <div>
          <label htmlFor="ownership-url" className="block  text-black leading-5 mb-2">
            Please share proof of ownership
          </label>
          <p className=" text-secondaryDark leading-[140%] mb-4">
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
            disabled={isEdit}
          />
        </div>
      </form>
    </>
  );
};

export default ProofsForm;
