import { ProposalType } from "@popcorn/hardhat/lib/adapters";
import ProposalPage from "components/Proposals/ProposalPage";

export default function SingleTakedownPage(): JSX.Element {
  return <ProposalPage proposalType={ProposalType.Takedown} />;
}
