import createElectionName from "./createElectionName";

export default function createGrantRounds(activeElections, closedElections) {
  const activeGrantRound = activeElections.map((election) => ({
    name: createElectionName(election),
    id: `active-${election.grantTerm}-${election.startTime}`,
    active: true,
    year: new Date(Number(election.startTime) * 1000).getFullYear(),
  }));
  const closedGrantRound = closedElections.map((election) => ({
    name: createElectionName(election),
    id: `closed-${election.grantTerm}-${election.startTime}`,
    active: false,
    year: new Date(Number(election.startTime) * 1000).getFullYear(),
  }));
  return [...activeGrantRound, ...closedGrantRound];
}
