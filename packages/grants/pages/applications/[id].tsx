import { Web3Provider } from "@ethersproject/providers";
import { Transition } from "@headlessui/react";
import { ShareIcon } from "@heroicons/react/outline";
import { ChevronLeftIcon } from "@heroicons/react/solid";
import { Proposal, ProposalType, VoteOptions } from "helper/types";
import { BeneficiaryGovernanceAdapter } from "helper/adapters";
import { IpfsClient } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import AboutTab from "components/Profile/AboutTab";
import GalleryTab from "components/Profile/GalleryTab";
import ReportsTab from "components/Profile/ReportsTab";
import VotePeriodCard from "components/Proposals/VotePeriodCard";
import VotingCard from "components/Proposals/VotingCard";
import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import { ContractsContext } from "context/Web3/contracts";
import { utils } from "ethers";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RWebShare } from "react-web-share";
import styled from "styled-components";
import StakeModalContent from "../../components/Proposals/StakeModalContent";
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
  const [showPopUp, setShowPopUp] = useState<boolean>(true);

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
        children: (
          <StakeModalContent
            beneficiary={proposal.application}
            onCloseStakeModal={closeStakeModal}
            hasExpired={expired}
            closePopUp={() => dispatch(setSingleActionModal({ visible: false }))}
          />
        ),
        visible: true,
        onDismiss: {
          onClick: () => dispatch(setSingleActionModal({ visible: false })),
        },
        showCloseButton: false,
      }),
    );
  };

  const openConfirmedStakeModal = () => {
    setHasStaked(true);
    dispatch(
      setSingleActionModal({
        image: <img src="/images/accept.svg" alt="Confirmed Stake" />,
        title: "You are now staked and ready to vote",
        visible: true,
        onConfirm: {
          label: "Done",
          onClick: () => {
            dispatch(setSingleActionModal(false));
          },
        },
        onDismiss: {
          onClick: () => dispatch(setSingleActionModal({ visible: false })),
        },
      }),
    );
  };

  const openAcceptApplicationModal = () => {
    dispatch(
      setSingleActionModal({
        image: <img src="/images/accept-application.svg" alt="Confirmed Stake" />,
        title: "Accept Application",
        content: `You are about to accept the "${proposal?.application?.organizationName}" beneficiary application in the Open Vote round.`,
        visible: true,
        onConfirm: {
          label: "Accept",
          onClick: () => {
            vote(VoteOptions.Yes);
          },
        },
        onDismiss: {
          label: "Cancel",
          onClick: () => {
            dispatch(setSingleActionModal(false));
          },
        },
      }),
    );
  };

  const openRejectApplicationModal = () => {
    dispatch(
      setSingleActionModal({
        image: <img src="/images/reject-application.svg" alt="Confirmed Stake" />,
        title: "Reject Application",
        content: `You are about to reject the "${proposal?.application?.organizationName}" beneficiary application in the Open Vote round.`,
        visible: true,
        onConfirm: {
          label: "Reject",
          onClick: () => {
            vote(VoteOptions.No);
          },
        },
        onDismiss: {
          label: "Cancel",
          onClick: () => {
            dispatch(setSingleActionModal(false));
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
        dispatch(setSingleActionModal(false));
        if (selectedVote === VoteOptions.Yes) {
          openVoteAcceptedModal();
        } else {
          openVoteRejectedModal();
        }
      })
      .catch((err) => {
        toast.dismiss();
        toast.error(err.data.message.split("'")[1] || err.data);
        dispatch(setSingleActionModal(false));
      });
  };

  const openVoteAcceptedModal = () => {
    dispatch(
      setSingleActionModal({
        image: <img src="/images/accept.svg" alt="Voted yes confirmed" />,
        title: "Vote Accepted",
        content:
          "You have accepted this application to become an eligible beneficiary in the Open Vote. If it passes this round, the organization will enter the second phase, Challenge Period",
        visible: true,
        onConfirm: {
          label: "Done",
          onClick: () => {
            fetchPageDetails();
            dispatch(setSingleActionModal(false));
          },
        },
        onDismiss: {
          onClick: () => dispatch(setSingleActionModal({ visible: false })),
        },
      }),
    );
  };

  const openVoteRejectedModal = () => {
    dispatch(
      setSingleActionModal({
        image: (
          <>
            <img src="/images/vote-rejected.svg" alt="Voted yes confirmed" className="hidden lg:block" />
            <img src="/images/accept.svg" alt="Voted yes confirmed" className="md:hidden" />
          </>
        ),
        title: "Vote Rejected",
        content: `You have rejected the proposal of "${proposal?.application?.projectName}" beneficiary from ${proposal?.application?.organizationName}. If a majority of the community votes to reject this beneficiary, they will no longer be eligible.`,
        visible: true,
        onConfirm: {
          label: "Continue",
          onClick: () => {
            fetchPageDetails();
            dispatch(setSingleActionModal(false));
          },
        },
        onDismiss: {
          onClick: () => dispatch(setSingleActionModal({ visible: false })),
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

  const isElemTop = (ele: Element) => {
    const { top } = ele.getBoundingClientRect();
    if (top <= 300) {
      setShowPopUp(false);
    } else setShowPopUp(true);
  };

  useEffect(() => {
    const profileContent = document.querySelector("#profileContent");
    window.addEventListener("scroll", () => isElemTop(profileContent));
  }, []);

  return (
    <section className="relative">
      <div className="md:hidden mb-10 px-6">
        <Link href={"/applications"}>
          <a className="flex space-x-2">
            <ChevronLeftIcon className="text-secondaryLight w-4" />
            <p className="text-primary">Beneficiary Application</p>
          </a>
        </Link>
      </div>
      <Hero
        bgImage={`https:/popcorn.mypinata.cloud/ipfs/${proposal?.application?.files?.headerImage?.image}`}
        className="relative"
      >
        <RWebShare
          data={{
            text: "Popcorn is a regenerative yield optimizing protocol",
            url: router.asPath,
            title: `Share ${proposal?.application?.organizationName}'s Proposal`,
          }}
        >
          <button className=" opacity-80 bg-white border-white rounded-3xl text-black font-medium hidden md:flex px-5 py-3 absolute gap-3 bottom-10 left-8 shadow-white-button ">
            <ShareIcon className="w-6 h-6" />
            Share
          </button>
        </RWebShare>
      </Hero>
      <div className="hidden md:block mx-8 mt-8">
        <Link href={"/applications"}>
          <a className="flex space-x-2">
            <ChevronLeftIcon className="text-secondaryLight w-4" />
            <p className="text-primary">Beneficiary Application</p>
          </a>
        </Link>
      </div>
      <div className="container mx-auto">
        <div className="grid grid-cols-12 md:gap-12">
          <div className="col-span-12 lg:col-span-7 xl:col-span-8">
            <div className="pt-10 md:pt-20 px-6 md:px-0">
              <div className="md:hidden mb-10">
                <VotePeriodCard stageDeadline={proposal?.stageDeadline} startTime={proposal?.startTime} />
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={`${process.env.IPFS_URL}${proposal?.application?.files?.profileImage?.image}`}
                  alt={proposal?.application?.files?.profileImage?.description || "profile-image"}
                  className=" w-36 h-36 rounded-full object-cover hidden md:block"
                />
                <div>
                  <p className="text-customLightGray text-base leading-7 uppercase">
                    {proposal?.application?.proposalCategory}
                  </p>
                  <h3 className="text-black text-5xl md:text-6xl my-4 leading-11">
                    {proposal?.application?.projectName}
                  </h3>
                  <p className="text-primaryDark text-base leading-7">by {proposal?.application?.organizationName}</p>
                </div>
              </div>
              <div className="py-10 flex">
                <RWebShare
                  data={{
                    text: "Popcorn is a regenerative yield optimizing protocol",
                    url: router.asPath,
                    title: `Share ${proposal?.application?.organizationName}'s Proposal`,
                  }}
                >
                  <button className="border border-primary bg-white h-12 w-12 rounded-full flex md:hidden justify-center items-center">
                    <ShareIcon className="w-6 h-6 text-primary" />
                  </button>
                </RWebShare>
              </div>
              <div className="flex justify-between md:justify-start md:space-x-4 pb-10 md:pb-20 md:pt-14">
                {profileTabs.map((tab) => (
                  <button
                    key={tab}
                    className={`rounded-[28px] px-5 py-3 text-lg border ${
                      currentTab == tab
                        ? "text-white bg-[#827D69] border-[#827D69]"
                        : "text-[#55503D] bg-white border-customLightGray"
                    }`}
                    onClick={() => setCurrentTab(tab)}
                  >
                    {capitalize(tab)}
                  </button>
                ))}
              </div>
              <div id="profileContent">
                {currentTab == "about" && <AboutTab {...proposal?.application} pageType="proposal" />}
                {currentTab == "gallery" && (
                  <GalleryTab additionalImages={proposal?.application.files.additionalImages} rowsPercent={50} />
                )}
                {currentTab == "reports" && <ReportsTab reports={proposal?.application.files.impactReports} />}
              </div>
            </div>
          </div>

          <div className="hidden lg:block col-span-12 lg:col-span-5 xl:col-span-4">
            <div className="absolute h-4/6 top-80">
              <div className="sticky top-40">
                <div className="w-[25rem] shadow-voting-card rounded-4xl">
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
      <Transition
        show={showPopUp}
        enter="transition-opacity duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed bottom-0 z-20 lg:hidden w-full">
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
      </Transition>
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
  @media screen and (max-width: 767px) {
    margin: 0 24px;
    border-radius: 8px;
    height: 185px;
  }
`;

export default ProposalPage;
