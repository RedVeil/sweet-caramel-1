import { FormStepProps } from "pages/proposals/propose";
import React from "react";
import inputExists from "utils/isValidInput";
import ContinueButton from "./ContinueButton";
import ControlledTextInput from "./ControlledTextInput";

export default function ProjectName({ form, navigation, visible }: FormStepProps): JSX.Element {
  const [formData, setFormData] = form;

  function updateProjectName(value: string): void {
    setFormData({
      ...formData,
      projectName: {
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
          {navigation.currentStep} - Add a project name (Optional)
        </h2>
        <ControlledTextInput
          inputValue={formData.projectName.data}
          id="project"
          placeholder="Project Name Name"
          errorMessage=""
          updateInput={updateProjectName}
          isValid={() => true}
        />
        {inputExists(formData.organizationName.data) && <ContinueButton navigation={navigation} />}
      </div>
    )
  );
}
