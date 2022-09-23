import { FormSteps } from "pages/apply/form";
import React from "react";
interface FlowStepsProps {
  active: FormSteps;
}
const FlowSteps: React.FC<FlowStepsProps> = ({ active }) => {
  const stepList: Array<{
    title: string;
    id: FormSteps;
  }> = [
    { id: FormSteps.GENERAL_INFORMATION, title: "General Information" },
    { id: FormSteps.PROOFS, title: "Proofs" },
    { id: FormSteps.IMPACT_REPORTS, title: "Impact Reports" },
    { id: FormSteps.VISUAL_CONTENT, title: "Visual Content" },
  ];
  return (
    <div className="flex justify-between overflow-x-hidden lg:overflow-x-hidden mx-6 md:mx-0">
      {stepList.map((step) => (
        <div
          className={`gap-3 items-center pr-5 md:pr-0 ${step.id < active ? "hidden md:flex" : "flex"}`}
          key={step.id}
        >
          <div
            className={`${
              active == step.id ? "bg-black" : "bg-gray-100"
            } rounded-xl h-10 w-10 flex justify-center items-center`}
          >
            <p className={`${active == step.id ? "text-white font-medium" : "text-tokenTextGray "} text-lg`}>
              {step.id + 1}
            </p>
          </div>
          <p
            className={`${
              active == step.id ? "text-black font-medium" : "text-tokenTextGray "
            } text-lg whitespace-nowrap`}
          >
            {step.title}
          </p>
        </div>
      ))}
    </div>
  );
};

export default FlowSteps;
