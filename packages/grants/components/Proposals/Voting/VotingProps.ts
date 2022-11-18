import { Proposal } from "@popcorn/hardhat/lib/adapters";

export interface VotingProps {
  proposal: Proposal;
  hasVoted?: boolean;
}
