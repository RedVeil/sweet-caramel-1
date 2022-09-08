import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/outline";
import React from "react";

interface ProgressProps {
  progress: number;
  labels: Array<string>;
}
const VotingProgress: React.FC<ProgressProps> = ({ progress, labels }) => {
  return (
    <div className="py-5">
      <div className="bg-blue-100 rounded-xl h-6 relative" style={{ padding: "2px" }}>
        <div className="flex justify-between absolute w-full pr-1 top-1/2 transform -translate-y-1/2">
          <CheckCircleIcon className="w-5 h-5 text-white" />
          <XCircleIcon className="w-5 h-5 text-gray-900" />
        </div>
        <div
          className="h-full bg-blue-800 rounded-xl transition-all ease-in-out duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between my-1">
        <p className="text-gray-400">
          {progress}% {labels[0]}
        </p>
        <p className="text-gray-400">
          {100 - progress}% {labels[1]}
        </p>
      </div>
    </div>
  );
};

export default VotingProgress;
