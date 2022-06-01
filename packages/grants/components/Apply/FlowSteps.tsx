import React from "react";
interface FlowStepsProps {
  active: Number;
}
const FlowSteps: React.FC<FlowStepsProps> = ({ active }) => {
  const stepList: Array<{
    title: String;
    id: number;
  }> = [
    { id: 0, title: "General Information" },
    { id: 1, title: "Proofs" },
    { id: 2, title: "Impact Reports" },
    { id: 3, title: "Visual Content" },
  ];
  return (
    <div className="flex justify-between overflow-x-scroll lg:overflow-x-hidden">
      {stepList.map((step) => (
        <div className="flex gap-3 items-center pr-5 md:pr-0" key={step.id.toString()}>
          <div
            className={`${
              active == step.id ? "bg-blue-50" : "bg-gray-100"
            } rounded-xl h-10 w-10 flex justify-center items-center`}
          >
            <p className={`${active == step.id ? "text-blue-600 font-semibold" : "text-gray-500 "} text-lg`}>
              {step.id + 1}
            </p>
          </div>
          <p
            className={`${
              active == step.id ? "text-blue-600 font-semibold" : "text-gray-500 "
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
