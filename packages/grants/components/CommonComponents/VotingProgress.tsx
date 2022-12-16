import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/outline";
import React from "react";

interface ProgressProps {
  progress: number;
  labels: Array<string>;
}
const VotingProgress: React.FC<ProgressProps> = ({ progress, labels }) => {
  return (
    <div className="py-6">
      <div className="bg-[#C294FC] rounded-xl h-6 relative" style={{ padding: "2px" }}>
        <div className="flex justify-between absolute w-full pr-1 top-1/2 transform -translate-y-1/2">
          <CheckCircleIcon className="w-5 h-5 text-white" />
          <XCircleIcon className="w-5 h-5 text-white" />
        </div>
        <div
          className="h-full bg-[#5F3699] rounded-xl transition-all ease-in-out duration-500"
          style={{ width: `${Math.round(progress)}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-4">
        <p className="text-tokenTextGray leading-[140%]">
          {progress}% {labels[0]}
        </p>
        <p className="text-tokenTextGray leading-[140%]">
          {100 - progress}% {labels[1]}
        </p>
      </div>
    </div>
  );
};

export default VotingProgress;
