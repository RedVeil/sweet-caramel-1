import { Proposal, ProposalStatus } from "@popcorn/hardhat/lib/adapters";
import { formatAndRoundBigNumber } from "@popcorn/utils";

interface VotingRowProps {
  name: string;
  value: string;
}

const VotingRow: React.FC<VotingRowProps> = (data) => {
  return (
    <span className="flex flex-row justify-between">
      <p className="text-base font-medium text-gray-700">{data.name}</p>
      <span className="text-base text-gray-700 flex flex-row">
        <p>{data.value}</p>
      </span>
    </span>
  );
};

const VotingInformation: React.FC<Proposal> = (proposal): JSX.Element => {
  return (
    <div className="my-4 mx-6">
      <VotingRow name={"Status"} value={ProposalStatus[proposal.status]} />
      <VotingRow name={"Voting Deadline"} value={proposal.stageDeadline.toLocaleString()} />
      <VotingRow name={"Votes For"} value={formatAndRoundBigNumber(proposal.votes.for, 18)} />
      <VotingRow name={"Votes Against"} value={formatAndRoundBigNumber(proposal.votes.against, 18)} />
      <VotingRow
        name={"Total Votes"}
        value={formatAndRoundBigNumber(proposal.votes.for.add(proposal.votes.against), 18)}
      />
    </div>
  );
};
export default VotingInformation;
