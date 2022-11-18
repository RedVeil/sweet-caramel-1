import { Vote } from "pages/grant-elections/[type]";

export default function calculateRemainingVotes(maxVotes: number, votes: Vote[] | Vote): number {
  return Array.isArray(votes) ? maxVotes - votes.reduce((acc, curr) => acc + curr.votes, 0) : maxVotes - votes.votes;
}
