import { ProposalType } from "@popcorn/hardhat/lib/adapters";
import ProposalGrid from "components/Proposals/ProposalGrid";

export default function TakedownPage(): JSX.Element {
  return <ProposalGrid proposalType={ProposalType.Nomination} />;
}
