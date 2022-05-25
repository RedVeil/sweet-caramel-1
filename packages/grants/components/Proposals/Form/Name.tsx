import { FormStepProps } from "pages/proposals/propose";
import React from "react";
import inputExists from "utils/isValidInput";
import ContinueButton from "./ContinueButton";
import ControlledTextInput from "./ControlledTextInput";

const Name: React.FC<FormStepProps> = ({ form, navigation, visible }) => {
  const [formData, setFormData] = form;

  function updateName(value: string): void {
    setFormData({
      ...formData,
      organizationName: {
        error: false,
        errorMessage: "",
        data: value,
      },
    });
  }

  return (
    visible && (
      <div className="mx-auto content-center justify-items-center">
        <h2 className="justify-self-center text-base text-indigo-600 font-semibold tracking-wide">
          {navigation.currentStep} - First things first, what's the name of the organization?
        </h2>
        <ControlledTextInput
          inputValue={formData.organizationName.data}
          id="name"
          placeholder="Organization's Name"
          errorMessage="Organization name cannot be blank."
          updateInput={updateName}
          isValid={inputExists}
        />
        {inputExists(formData.organizationName.data) && <ContinueButton navigation={navigation} />}
      </div>
    )
  );
};
export default Name;
