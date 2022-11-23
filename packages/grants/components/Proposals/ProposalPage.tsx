import { Web3Provider } from "@ethersproject/providers";
import { Proposal, ProposalStatus, ProposalType } from "helper/types";
import { BeneficiaryGovernanceAdapter } from "helper/adapters";
import { IpfsClient } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import BeneficiaryInformation from "components/CommonComponents/BeneficiaryInformation";
import ImageHeader from "components/CommonComponents/ImageHeader";
import Loading from "components/CommonComponents/Loading";
import PhotoSideBar from "components/CommonComponents/PhotoSideBar";
import VideoSideBar from "components/CommonComponents/VideoSideBar";
import NavBar from "components/NavBar/NavBar";
import { ContractsContext } from "context/Web3/contracts";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Voting from "./Voting/Voting";

const getTitle = (proposal: Proposal): string => {
  return `${ProposalStatus[proposal.status]} vote on ${proposal?.application?.organizationName}`;
};

export interface ProposalPageProps {
  proposalType: ProposalType;
}

const ProposalPage: React.FC<ProposalPageProps> = ({ proposalType }) => {
  const { contracts } = useContext(ContractsContext);
  const { account } = useWeb3React<Web3Provider>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal>();
  const [proposalId, setProposalId] = useState<string>();
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  useEffect(() => {
    const { id } = router.query;
    if (id && id !== proposalId) setProposalId(id as string);
  }, [router, proposalId]);

  useEffect(() => {
    if (contracts?.beneficiaryGovernance && proposalId) {
      new BeneficiaryGovernanceAdapter(contracts.beneficiaryGovernance, IpfsClient)
        .getProposal(Number(proposalId))
        .then((proposal) => {
          proposal.proposalType === proposalType
            ? setProposal(proposal)
            : toast.error(`A ${ProposalType[proposalType]} proposal at index ${proposalId} does not exist`);
        })
        .catch((err) => toast.error(err.message));
    }
  }, [contracts, account, proposalId]);

  useEffect(() => {
    if (contracts?.beneficiaryGovernance && proposal && account) {
      new BeneficiaryGovernanceAdapter(contracts.beneficiaryGovernance, IpfsClient)
        .hasVoted(Number(proposalId), account)
        .then((res) => setHasVoted(res));
    }
  }, [contracts, account, proposal]);

  function getContent() {
    return proposalId && proposal && Object.keys(proposal).length > 0 ? (
      <React.Fragment>
        <ImageHeader beneficiary={proposal?.application} title={getTitle(proposal)} />
        <Voting proposal={proposal} hasVoted={hasVoted} />
        <div className="grid grid-cols-8 gap-4 space-x-12 mx-auto px-8">
          <div className="col-span-2 space-y-4">
            <VideoSideBar beneficiary={proposal?.application} />
            <PhotoSideBar beneficiary={proposal?.application} />
          </div>
          <BeneficiaryInformation beneficiary={proposal?.application} isProposalPreview={false} />
        </div>
      </React.Fragment>
    ) : (
      <Loading />
    );
  }
  return (
    <div className="flex flex-col h-full w-full pb-16 ">
      <NavBar />
      <Toaster position="top-right" />
      {getContent()}
    </div>
  );
};
export default ProposalPage;
