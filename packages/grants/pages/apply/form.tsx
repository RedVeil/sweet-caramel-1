import { XCircleIcon } from "@heroicons/react/solid";
import { BeneficiaryApplication } from "@popcorn/hardhat/lib/adapters";
import FlowSteps from "components/Apply/FlowSteps";
import GeneralInformation from "components/Apply/GeneralInformation";
import ProofsForm from "components/Apply/ProofsForm";
import Button from "components/CommonComponents/Button";
import React, { useEffect, useState } from "react";

export const defaultFormData: BeneficiaryApplication = {
  organizationName: {
    error: false,
    errorMessage: "",
    data: "",
  },
  projectName: {
    error: false,
    errorMessage: "",
    data: "",
  },
  missionStatement: {
    error: false,
    errorMessage: "",
    data: "",
  },
  beneficiaryAddress: {
    error: false,
    errorMessage: "",
    data: "",
  },
  proposalCategory: {
    error: false,
    errorMessage: "",
    data: "",
  },
  files: {
    profileImage: { image: "", description: "" },
    headerImage: { image: "", description: "" },
    impactReports: [],
    additionalImages: [],
    video: "",
  },
  links: {
    twitterUrl: "",
    linkedinUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    githubUrl: "",
    proofOfOwnership: {
      error: false,
      errorMessage: "",
      data: "",
    },
    contactEmail: {
      error: false,
      errorMessage: "",
      data: "",
    },
    website: "",
  },
  version: "1.0",
};

enum FormSteps {
  GENERAL_INFORMATION,
  PROOFS,
  IMPACT_REPORTS,
  VISUAL_CONTENT,
}

const ApplyForm = () => {
  const [activeForm, setActiveForm] = useState<FormSteps>(FormSteps.GENERAL_INFORMATION);
  const [formData, setFormData] = useState<BeneficiaryApplication>(defaultFormData);
  const [errors, setErrors] = useState<Array<string>>([]);
  const [showErrors, setShowErrors] = useState<boolean>(false);
  useEffect(() => {
    const formData = localStorage.getItem("beneficiaryApplicationForm");
    if (formData !== null) setFormData(JSON.parse(formData));
    const currentStep: FormSteps = parseInt(localStorage.getItem("beneficiaryApplicationStep"));
    if (currentStep) setActiveForm(currentStep);
  }, []);
  useEffect(() => {
    localStorage.setItem("beneficiaryApplicationForm", JSON.stringify(formData));
    let errors = Object.keys(formData)
      .map((key) => {
        return formData[key]?.error ? formData[key]?.errorMessage : null;
      })
      .filter((error) => error);
    let linkErrors = Object.keys(formData.links)
      .map((key) => {
        return formData.links[key]?.error ? formData.links[key]?.errorMessage : null;
      })
      .filter((error) => error);
    errors = errors.concat(linkErrors);
    setErrors(errors);
  }, [formData]);

  const updateErrors = (value: string) => {
    setErrors((currentErrors) => [...currentErrors, value]);
  };

  const nextActiveForm = () => {
    setShowErrors(false);
    if (errors.length > 0) {
      setShowErrors(true);
      window.scrollTo(0, 0);
    } else {
      let step = activeForm + 1;
      setActiveForm(step);
      localStorage.setItem("beneficiaryApplicationStep", JSON.stringify(step));
    }
  };

  const prevActiveForm = () => {
    let step = activeForm - 1;
    setActiveForm(step);
    localStorage.setItem("beneficiaryApplicationStep", JSON.stringify(step));
  };

  return (
    <main className="container mx-auto py-20">
      <div className="px-5 lg:px-36">
        {showErrors ? (
          <div className="bg-red-50 rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <XCircleIcon className=" text-red-400 w-4 h-4" />{" "}
              <p className=" font-semibold text-red-800">There were {errors.length} errors with your submission</p>
            </div>
            <ul className=" list-disc pl-4">
              {errors.map((error, index) => (
                <li className="text-red-700" key={index}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <FlowSteps active={activeForm} />
        )}
        {activeForm == FormSteps.GENERAL_INFORMATION ? (
          <GeneralInformation form={[formData, setFormData]} updateErrors={updateErrors} />
        ) : activeForm == FormSteps.PROOFS ? (
          <ProofsForm />
        ) : (
          ""
        )}

        <div className="flex justify-center gap-8 mt-20 mb-20 md:mb-40">
          {activeForm > 1 && (
            <Button variant="outline" className="py-2 px-6" onClick={prevActiveForm}>
              Back
            </Button>
          )}
          <Button variant="primary" className="py-2 px-6" onClick={nextActiveForm}>
            Next
          </Button>
        </div>
      </div>
    </main>
  );
};

export default ApplyForm;
