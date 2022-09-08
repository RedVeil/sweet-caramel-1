import { Transition } from "@headlessui/react";
import { ProposalStatus } from "@popcorn/hardhat/lib/adapters";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import Button from "components/CommonComponents/Button";
import VotingProgress from "components/CommonComponents/VotingProgress";
import CaretIcon from "components/Svgs/CaretIcon";
import { BigNumber } from "ethers";
import React, { useEffect, useState } from "react";
import { formatTimeUntilDeadline } from "../../utils/formatTimeUntilDeadline";

interface VotingCardProps {
  votes: {
    against: BigNumber;
    for: BigNumber;
  };
  stageDeadline: Date;
  hasStaked: boolean;
  hasVoted: boolean;
  openStakeModal: () => void;
  account: string;
  status: ProposalStatus;
  acceptApplication: () => void;
  rejectApplication: () => void;
}
const VotingCard: React.FC<VotingCardProps> = ({
  votes,
  stageDeadline,
  hasStaked,
  openStakeModal,
  account,
  status,
  acceptApplication,
  rejectApplication,
  hasVoted,
}) => {
  const [showVotes, setShowVotes] = useState<boolean>(true);
  const [progress, setProgress] = useState(50);
  useEffect(() => {
    if (window.matchMedia("(max-width: 999px)").matches) {
      setShowVotes(false);
    }
  }, []);

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

  const toggleVotes = () => {
    setShowVotes(!showVotes);
  };

  return (
    <div
      className="bg-white rounded-t-4xl shadow-voting-card-mobile md:shadow-voting-card text-center p-8 transition-all duration-1000 ease-in-out"
      style={{ height: `${showVotes ? "100%" : "250px"}` }}
    >
      <div
        className={`lg:hidden flex mb-5 justify-center transition-all duration-300 transform ${!showVotes ? " rotate-180" : ""
          }`}
      >
        <CaretIcon className="animate-bounce" onClick={toggleVotes} />
      </div>
      <h5 className="text-gray-900 text-2xl font-semibold mb-2">
        {ProposalStatus[status]} {status == 0 ? "Vote" : status == 1 ? "Period" : ""}
      </h5>
      <p className="text-gray-400 mb-6">{formatTimeUntilDeadline(stageDeadline)}</p>

      <Transition
        show={showVotes}
        enter="transition-opacity duration-1000"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-1000"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <h6 className="text-gray-900 font-semibold mb-1">Becoming an Eligible Beneficiary</h6>
        <p className="text-gray-500">
          The organization is currently in the first phase of voting and users have 48 hours to cast their vote.
        </p>
        <VotingProgress progress={progress} labels={["Yes", "No"]} />
      </Transition>
      {!hasVoted && hasStaked && (
        <div className="flex gap-2">
          <Button variant="primary" className="px-3 py-3 w-1/2" onClick={acceptApplication}>
            Accept
          </Button>
          <Button variant="secondary" className="px-3 py-3 w-1/2" onClick={rejectApplication}>
            Reject
          </Button>
        </div>
      )}
      {!hasVoted && !hasStaked && (
        <Button variant="primary" className="px-3 py-3 w-full" onClick={openStakeModal} disabled={!account}>
          Stake to vote
        </Button>
      )}
    </div>
  );
};

export default VotingCard;
