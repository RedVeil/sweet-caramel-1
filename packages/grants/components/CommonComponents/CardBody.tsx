import { Image as ImageUpload, ProposalStatus } from "helper/types";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import VotingProgress from "components/CommonComponents/VotingProgress";
import { BigNumber } from "ethers";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { formatTimeUntilDeadline } from "../../utils/formatTimeUntilDeadline";
export interface CardBodyProps {
  image: ImageUpload;
  organizationName: string;
  missionStatement: string;
  isApplication?: boolean;
  votes?: {
    against: BigNumber;
    for: BigNumber;
  };
  stageDeadline?: Date;
  status?: ProposalStatus;
}

const CardBody: React.FC<CardBodyProps> = ({
  image,
  organizationName,
  missionStatement,
  stageDeadline,
  votes,
  status,
  isApplication = false,
}) => {
  const [progress, setProgress] = useState(50);
  useEffect(() => {
    const forVotes = parseInt(formatAndRoundBigNumber(votes?.for, 18));
    const againstVotes = parseInt(formatAndRoundBigNumber(votes?.against, 18));
    if (forVotes + againstVotes == 0) {
      setProgress(50);
      return;
    }
    let progressVotes = (forVotes / (forVotes + againstVotes)) * 100;
    setProgress(Math.round((progressVotes + Number.EPSILON) * 100) / 100);
  }, [votes]);

  const formatStatus = (status: ProposalStatus): string => {
    if (status === ProposalStatus.Passed || status === ProposalStatus.Failed) {
      return "Completed";
    }
    return ProposalStatus[status];
  };

  const isCompleted = (status: ProposalStatus) => formatStatus(status) === "Completed";

  return (
    <div className="bg-white rounded-lg transition duration-500 ease-in-out transform hover:scale-102 border border-customLightGray">
      <div className="relative">
        <div className="w-full h-[200px] relative">
          <Image
            className="rounded-t-lg relative"
            src={`${process.env.IPFS_URL}${image?.image}`}
            alt={image?.description}
            objectFit="cover"
            objectPosition="top"
            layout="fill"
          />
        </div>
        {isApplication && (
          <div className="flex justify-between px-4 absolute top-5 w-full">
            <div>
              {!isCompleted(status) && (
                <div className="bg-primary bg-opacity-75 rounded-4xl px-4 py-2 text-white">
                  {formatTimeUntilDeadline(stageDeadline)}
                </div>
              )}
            </div>
            <div
              className={`bg-white bg-opacity-90 rounded-4xl px-4 py-2 ${
                isCompleted(status) ? "text-white bg-secondaryLight" : "text-black bg-white"
              }`}
            >
              {formatStatus(status)} {status == 0 ? "Vote" : status == 1 ? "Period" : ""}
            </div>
          </div>
        )}
      </div>
      <div className="h-44 bg-white py-8 px-6 flex flex-col justify-between rounded-b-4xl">
        <div className="h-full overflow-hidden">
          <p className="text-xl font-semibold text-gray-900 line-clamp-title leading-8 overflow-hidden">
            {organizationName}
          </p>
          <p className="mt-3 text-base text-gray-500 font-light line-clamp leading-[140%]">{missionStatement}</p>
        </div>
      </div>
      {isApplication && (
        <div className="px-5">
          <VotingProgress progress={progress} labels={["Accept", "Reject"]} />
        </div>
      )}
    </div>
  );
};
export default CardBody;
