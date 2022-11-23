import { ProposalType } from "helper/types";
import ProposalPage from "components/Proposals/ProposalPage";

export default function SingleTakedownPage(): JSX.Element {
  return <ProposalPage proposalType={ProposalType.Takedown} />;
}
