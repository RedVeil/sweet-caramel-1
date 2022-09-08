import { Web3Provider } from "@ethersproject/providers";
import { ShareIcon } from "@heroicons/react/outline";
import { BeneficiaryGovernanceAdapter, Proposal, ProposalType } from "@popcorn/hardhat/lib/adapters";
import { VoteOptions } from "@popcorn/hardhat/lib/bengov/constants";
import { IpfsClient } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import AboutTab from "components/Profile/AboutTab";
import GalleryTab from "components/Profile/GalleryTab";
import ReportsTab from "components/Profile/ReportsTab";
import VotePeriodCard from "components/Proposals/VotePeriodCard";
import VotingCard from "components/Proposals/VotingCard";
import { ContractsContext } from "context/Web3/contracts";
import { utils } from "ethers";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RWebShare } from "react-web-share";
import styled from "styled-components";
import StakeModalContent from "../../components/Proposals/StakeModalContent";
import { setDualActionModal, setSingleActionModal } from "../../context/actions";
import { store } from "../../context/store";
import capitalize from "../../utils/capitalizeFirstLetter";

export interface ProposalPageProps {
  proposalType: ProposalType;
}

export interface Vote {
  address: string;
  votes: number;
}

const ProposalPage: React.FC<ProposalPageProps> = ({ proposalType }) => {
  const router = useRouter();
  const { contracts } = useContext(ContractsContext);
  const { account, library } = useWeb3React<Web3Provider>();
  const [proposal, setProposal] = useState<Proposal>();
  const [proposalId, setProposalId] = useState<string>();
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>("about");
  const { dispatch } = useContext(store);
  const [lockedPop, setLockedPop] = useState(0);
  const [expired, setExpired] = useState<boolean>(false);
  const [hasStaked, setHasStaked] = useState<boolean>(false);

  const profileTabs = ["about", "gallery", "reports"];

  useEffect(() => {
    const { id } = router.query;
    if (id && id !== proposalId) setProposalId(id as string);
  }, [router, proposalId]);

  useEffect(() => {
    if (contracts?.beneficiaryGovernance && proposalId) {
      fetchPageDetails();
    }
  }, [contracts, account, proposalId]);

  useEffect(() => {
    if (contracts?.beneficiaryGovernance && proposal && account) {
      new BeneficiaryGovernanceAdapter(contracts.beneficiaryGovernance, IpfsClient)
        .hasVoted(Number(proposalId), account)
        .then((res) => {
          setHasVoted(res);
        });
    }
  }, [contracts, account, proposal]);

  const fetchPageDetails = () => {
    new BeneficiaryGovernanceAdapter(contracts.beneficiaryGovernance, IpfsClient)
      .getProposal(Number(proposalId))
      .then((proposal) => {
        proposal.proposalType === ProposalType.Nomination
          ? setProposal(proposal)
          : toast.error(`A ${ProposalType[proposalType]} proposal at index ${proposalId} does not exist`);
      })
      .catch((err) => toast.error(err.message));
  };

  const closeStakeModal = () => {
    dispatch(setSingleActionModal({ visible: false }));
    openConfirmedStakeModal();
  };

  const openStakeModal = () => {
    dispatch(
      setSingleActionModal({
        content: (
          <StakeModalContent
            beneficiary={proposal.application}
            onCloseStakeModal={closeStakeModal}
            hasExpired={expired}
          />
        ),
        visible: true,
      }),
    );
  };

  const openConfirmedStakeModal = () => {
    setHasStaked(true);
    dispatch(
      setSingleActionModal({
        image: <img src="/images/stakeCheckIcon.svg" alt="Confirmed Stake" />,
        title: "You are now staked and ready to vote",
        visible: true,
        onConfirm: {
          label: "Done",
          onClick: () => {
            dispatch(setSingleActionModal(false));
          },
        },
      }),
    );
  };

  const openAcceptApplicationModal = () => {
    dispatch(
      setDualActionModal({
        icon: <img src="/images/stakeCheckIcon.svg" alt="Confirmed Stake" />,
        title: "Accept Application",
        content: (
          <p className="font-semibold text-gray-500">
            You are about to{" "}
            <span className="text-gray-900">
              accept the {proposal?.application?.organizationName} beneficiary application
            </span>{" "}
            in the Open Vote round.
          </p>
        ),
        visible: true,
        onConfirm: {
          label: "Accept",
          onClick: () => {
            vote(VoteOptions.Yea);
          },
        },
        onDismiss: {
          label: "Cancel",
          onClick: () => {
            dispatch(setDualActionModal(false));
          },
        },
      }),
    );
  };

  const openRejectApplicationModal = () => {
    dispatch(
      setDualActionModal({
        icon: <img src="/images/stakeRejectIcon.svg" alt="Confirmed Stake" />,
        title: "Reject Application",
        content: (
          <p className="font-semibold text-gray-500">
            You are about to{" "}
            <span className="text-gray-900">
              reject the {proposal?.application?.organizationName} beneficiary application
            </span>{" "}
            in the Open Vote round.
          </p>
        ),
        visible: true,
        onConfirm: {
          label: "Reject",
          onClick: () => {
            vote(VoteOptions.Nay);
          },
        },
        onDismiss: {
          label: "Cancel",
          onClick: () => {
            dispatch(setDualActionModal(false));
          },
        },
      }),
    );
  };

  const vote = (selectedVote: VoteOptions) => {
    toast.loading("Submitting vote...");
    contracts.beneficiaryGovernance
      .connect(library.getSigner())
      .vote(proposal.id, selectedVote)
      .then((res) => {
        toast.dismiss();
        toast.success("Voted successfully!");
        setHasVoted(true);
        dispatch(setDualActionModal(false));
        if (selectedVote === VoteOptions.Yea) {
          openVoteAcceptedModal();
        } else {
          openVoteRejectedModal();
        }
      })
      .catch((err) => {
        toast.dismiss();
        toast.error(err.data.message.split("'")[1]);
        dispatch(setDualActionModal(false));
      });
  };

  const openVoteAcceptedModal = () => {
    dispatch(
      setSingleActionModal({
        image: <img src="/images/voted yes.svg" alt="Voted yes confirmed" />,
        title: "Vote Accepted",
        content: (
          <p className="text-gray-500">
            You have accepted this application to become an eligible beneficiary in the Open Vote. If it passes this
            round, the organization will enter the second phase, Challenge Period
          </p>
        ),
        visible: true,
        onConfirm: {
          label: "Done",
          onClick: () => {
            fetchPageDetails();
            dispatch(setSingleActionModal(false));
          },
        },
      }),
    );
  };

  const openVoteRejectedModal = () => {
    dispatch(
      setSingleActionModal({
        image: <img src="/images/voted no.svg" alt="Voted yes confirmed" />,
        title: "Vote Rejected",
        content: (
          <p className="text-gray-500">
            You have rejected the proposal of "{proposal?.application?.projectName}" beneficiary from{" "}
            {proposal?.application?.organizationName}. If a majority of the community votes to reject this beneficiary,
            they will no longer be eligible.
          </p>
        ),
        visible: true,
        onConfirm: {
          label: "Done",
          onClick: () => {
            fetchPageDetails();
            dispatch(setSingleActionModal(false));
          },
        },
      }),
    );
  };

  const refetchLockedPop = async () => {
    const lockedBalance = await contracts.staking.lockedBalances(account);
    const currentTime = parseInt(`${new Date().getTime() / 1000}`);
    const lockedPop = Number(utils.formatEther(await contracts.staking.balanceOf(account)));
    if (lockedPop && !lockedBalance.end.lt(currentTime)) {
      setHasStaked(true);
    }
    setExpired(lockedBalance.end.lt(currentTime));
    setLockedPop(lockedPop);
  };

  useEffect(() => {
    if (contracts?.staking && account) {
      refetchLockedPop();
    }
  }, [contracts]);

  return (
    <section className="relative">
      <Hero
        bgImage={`https:/popcorn.mypinata.cloud/ipfs/${proposal?.application?.files?.headerImage?.image}`}
        className="relative"
      >
        <RWebShare
          data={{
            url: router.asPath,
            title: `Share ${proposal?.application?.organizationName}'s Proposal`,
          }}
        >
          <button className=" opacity-80 bg-white border-gray-200 rounded-3xl text-gray-900 font-semibold flex px-5 py-3 absolute gap-3 bottom-10 left-2/3 md:left-10 xl:left-28 ml-2 shadow-white-button">
            <ShareIcon className="w-6 h-6" />
            Share
          </button>
        </RWebShare>
      </Hero>
      <div className="container mx-auto pb-20 md:pb-60">
        <div className="grid grid-cols-12 px-5 lg:px-10 md:gap-12">
          <div className="col-span-12 lg:col-span-7 xl:col-span-8 py-20">
            <div className="flex items-center gap-3">
              <img
                src={`${process.env.IPFS_URL}${proposal?.application?.files?.profileImage?.image}`}
                alt={proposal?.application?.files?.profileImage?.description || "profile-image"}
                className=" w-20 h-20 rounded-full object-cover"
              />
              <div>
                <p className="text-gray-400 text-lg uppercase">{proposal?.application?.proposalCategory}</p>
                <h3 className="text-gray-900 text-3xl md:text-5xl font-semibold my-2">
                  {proposal?.application?.projectName}
                </h3>
                <p className="text-gray-900 text-lg">by {proposal?.application?.organizationName}</p>
              </div>
            </div>
            <div className="md:hidden my-16">
              <VotePeriodCard stageDeadline={proposal?.stageDeadline} startTime={proposal?.startTime} />
            </div>
            <div className="flex justify-center gap-10 md:gap-20 pb-18 md:py-24">
              {profileTabs.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-3xl px-5 py-3 font-semibold text-lg ${
                    currentTab == tab ? "text-blue-600 bg-blue-50" : "text-gray-500 bg-white"
                  }`}
                  onClick={() => setCurrentTab(tab)}
                >
                  {capitalize(tab)}
                </button>
              ))}
            </div>

            {currentTab == "about" && <AboutTab {...proposal?.application} pageType="proposal" />}
            {currentTab == "gallery" && (
              <GalleryTab additionalImages={proposal?.application.files.additionalImages} rowsPercent={50} />
            )}
            {currentTab == "reports" && <ReportsTab reports={proposal?.application.files.impactReports} />}
          </div>

          <div className="hidden lg:block col-span-12 lg:col-span-5 xl:col-span-4">
            <div className="absolute h-4/6 top-80">
              <div className="sticky top-40">
                <div className="w-96">
                  <VotingCard
                    votes={proposal?.votes}
                    stageDeadline={proposal?.stageDeadline}
                    hasStaked={hasStaked}
                    openStakeModal={openStakeModal}
                    account={account}
                    status={proposal?.status}
                    hasVoted={hasVoted}
                    acceptApplication={openAcceptApplicationModal}
                    rejectApplication={openRejectApplicationModal}
                  />
                  <VotePeriodCard stageDeadline={proposal?.stageDeadline} startTime={proposal?.startTime} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 lg:hidden w-full">
        <VotingCard
          votes={proposal?.votes}
          stageDeadline={proposal?.stageDeadline}
          hasStaked={hasStaked}
          openStakeModal={openStakeModal}
          account={account}
          status={proposal?.status}
          hasVoted={hasVoted}
          acceptApplication={openAcceptApplicationModal}
          rejectApplication={openRejectApplicationModal}
        />
      </div>
    </section>
  );
};
interface HeroProps {
  bgImage: string;
}
const Hero = styled.div<HeroProps>`
  height: 65vh;
  background-image: ${({ bgImage }) => `url(${bgImage})` || ""};
  background-size: cover;
  background-position: center;
`;

export default ProposalPage;
