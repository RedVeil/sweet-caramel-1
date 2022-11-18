import { Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/outline";
import { ProposalStatus } from "@popcorn/hardhat/lib/adapters";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import Button from "components/CommonComponents/Button";
import VotingProgress from "components/CommonComponents/VotingProgress";
import { BigNumber } from "ethers";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
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
  const [showVotes, setShowVotes] = useState<boolean>(false);
  const [progress, setProgress] = useState(50);
  useEffect(() => {
    if (window.matchMedia("(min-width: 1000px)").matches) {
      setShowVotes(true);
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

  const getPopModalHeight = () => {
    let height;
    if (!hasVoted && !hasStaked) {
      if (showVotes) {
        height = "430px";
      } else height = "226px";
    } else {
      if (showVotes) {
        height = "490px";
      } else height = "286px";
    }
    return height;
  };

  return (
    <VotingCardCon
      className={`bg-white rounded-t-4xl shadow-voting-card-mobile md:shadow-none p-6 md:p-8 transition-all duration-1000 ease-in-out md:h-full`}
      mobileHeight={getPopModalHeight()}
    >
      <div
        className={`lg:hidden flex justify-center mb-5 transition-all duration-300 transform ${
          !showVotes ? " rotate-180" : ""
        }`}
      >
        <ChevronDownIcon className="animate-bounce text-secondaryLight w-5" onClick={toggleVotes} />
      </div>
      <h5 className="text-black text-3xl leading-8 mb-2">
        {ProposalStatus[status]} {status == 0 ? "Vote" : status == 1 ? "Period" : ""}
      </h5>
      <p className="text-tokenTextGray leading-6 mb-6">{formatTimeUntilDeadline(stageDeadline)}</p>

      <Transition
        show={showVotes}
        enter="transition-opacity duration-1000"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-1000"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <h6 className="text-primaryDark font-medium mb-1">Becoming an Eligible Beneficiary</h6>
        <p className="text-primaryDark">
          The organization is currently in the first phase of voting and users have 48 hours to cast their vote.
        </p>
        <VotingProgress progress={progress} labels={["Yes", "No"]} />
      </Transition>
      {!hasVoted && hasStaked && (
        <div>
          <Button variant="primary" className="px-3 py-3 w-full" onClick={acceptApplication}>
            Accept
          </Button>
          <Button variant="secondary" className="px-3 py-3 w-full mt-4" onClick={rejectApplication}>
            Reject
          </Button>
        </div>
      )}
      {!hasVoted && !hasStaked && (
        <Button variant="primary" className="px-3 py-3 w-full" onClick={openStakeModal} disabled={!account}>
          Stake to vote
        </Button>
      )}
    </VotingCardCon>
  );
};

interface CardProps {
  mobileHeight: string;
}
const VotingCardCon = styled.div<CardProps>`
  height: 100%;
  @media screen and (max-width: 999px) {
    height: ${({ mobileHeight }) => mobileHeight};
  }
`;

export default VotingCard;
