import { ElectionMetadata } from "@popcorn/hardhat/lib/adapters";
import createElectionName from "./createElectionName";

export default function createGrantRounds(activeElections: ElectionMetadata[], closedElections: ElectionMetadata[]) {
  const activeGrantRound = activeElections.map((election) => ({
    name: createElectionName(election),
    id: `active-${election.electionTerm}-${election.startTime}`,
    active: true,
    year: new Date(Number(election.startTime) * 1000).getFullYear(),
  }));
  const closedGrantRound = closedElections.map((election) => ({
    name: createElectionName(election),
    id: `closed-${election.electionTerm}-${election.startTime}`,
    active: false,
    year: new Date(Number(election.startTime) * 1000).getFullYear(),
  }));
  return [...activeGrantRound, ...closedGrantRound];
}
