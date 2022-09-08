import { Menu } from "@headlessui/react";
import { ViewGridIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { BeneficiaryGovernanceAdapter, Proposal, ProposalStatus, ProposalType } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import Button from "components/CommonComponents/Button";
import CardBody from "components/CommonComponents/CardBody";
import { CardLoader } from "components/CommonComponents/CardLoader";
import NotFoundError from "components/CommonComponents/NotFoundError";
import { ContractsContext } from "context/Web3/contracts";
import Link from "next/link";
import { filterValues } from "pages";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const index = () => {
  const filterList = [
    filterValues.all,
    filterValues.environment,
    filterValues.education,
    filterValues.inequality,
    filterValues.openSource,
  ];
  const switchFilter = (value: string) => {
    setCategoryFilter(value);
  };

  const applicationTypes = [
    { label: "All", status: ProposalStatus.All },
    { label: "Open Vote", status: ProposalStatus.Open },
    { label: "Challenge Period", status: ProposalStatus.Challenge },
    { label: "Completed", status: ProposalStatus.Completed },
  ];
  const { contracts } = useContext(ContractsContext);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus>(ProposalStatus.All);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(9);

  useEffect(() => {
    if (contracts?.beneficiaryGovernance) {
      setIsLoading(true);
      new BeneficiaryGovernanceAdapter(contracts?.beneficiaryGovernance, IpfsClient)
        .getAllProposals(ProposalType.Nomination)
        .then((res) => {
          let sortedProposals = res.sort(sortProposals);
          setProposals(sortedProposals);
          setFilteredProposals(sortedProposals.slice(0, offset));
          setIsLoading(false);
        })
        .catch((err) => {
          toast.error(err.message);
          setIsLoading(false);
        });
    }
  }, [contracts]);

  useEffect(() => {
    const filteringProposals = proposals
      ?.filter((proposal: Proposal) => {
        const proposalStatus = proposal?.status;
        if (statusFilter === ProposalStatus.Completed) {
          return proposalStatus === ProposalStatus.Passed || proposalStatus === ProposalStatus.Failed;
        }
        return proposalStatus === statusFilter || statusFilter === ProposalStatus.All;
      })
      ?.filter((proposal: Proposal) => {
        if (categoryFilter === "All") {
          return proposal;
        }
        return proposal.application?.proposalCategory?.toLowerCase() === categoryFilter.toLowerCase();
      });
    setFilteredProposals(filteringProposals.sort(sortProposals));
  }, [statusFilter, categoryFilter]);

  const sortProposals = (currentDate: { stageDeadline: Date }, nextDate: { stageDeadline: Date }) =>
    nextDate.stageDeadline.getTime() - currentDate.stageDeadline.getTime();

  const seeMore = () => {
    let newOffset = offset + 9;
    setOffset(newOffset);
    setFilteredProposals(proposals.slice(0, newOffset));
  };

  return (
    <section className="container mx-auto">
      <div className="pt-32 pb-10">
        <h1 className="text-gray-900 font-semibold text-5xl mb-2">Beneficiary Applications</h1>
        <p className=" text-2xl text-gray-900">Vote for any eligible beneficiary’s proposal</p>

        <div className="flex justify-between relative pt-32">
          <Menu>
            <Menu.Button className="bg-white rounded-3xl shadow-custom-lg">
              <div className="w-32 md:w-44 cursor-pointer h-full py-3 px-5 flex flex-row items-center justify-between rounded-3xxl">
                <div className="flex items-center">
                  <ViewGridIcon className="text-gray-400 w-3 h-3 md:w-5 md:h-5" />
                  <p className="text-xs md:text-sm font-medium ml-1 leading-none text-gray-400">{categoryFilter}</p>
                </div>
                <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <BeneficiaryFilter
                filterList={filterList}
                switchFilter={switchFilter}
                position="absolute top-36 left-0 z-40"
                width="w-44"
                selectedItem={categoryFilter}
              />
            </Menu.Button>
          </Menu>

          <div className="hidden lg:flex gap-4">
            {applicationTypes.map((type) => (
              <button
                key={type.status}
                className={`${
                  statusFilter == type.status ? "text-white bg-blue-600" : "bg-white text-gray-700 "
                }  rounded-3xl font-semibold px-5 py-2 shadow-custom`}
                onClick={() => setStatusFilter(type.status)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <section className="grid grid-cols-12 py-20 gap-y-10 md:gap-10">
          {isLoading &&
            [1, 2, 3].map((i) => (
              <div className="col-span-12 md:col-span-6 lg:col-span-4" key={i}>
                <CardLoader key={i} />
              </div>
            ))}
          {!isLoading && filteredProposals.length <= 0 ? (
            <div className="col-span-12">
              <NotFoundError
                image="/images/emptyBeneficiariesState.svg"
                title="There are no Beneficiary Applications currently"
              >
                <p className="text-gray-700">
                  Check back at a later date or follow our{" "}
                  <a href="https://discord.gg/w9zeRTSZsq" target="_blank" className="text-blue-600 font-semibold">
                    Discord
                  </a>{" "}
                  or{" "}
                  <a href="https://twitter.com/Popcorn_DAO" target="_blank" className="text-blue-600 font-semibold">
                    Twitter
                  </a>{" "}
                  for more information.
                </p>
              </NotFoundError>
            </div>
          ) : (
            filteredProposals.map((beneficiary) => (
              <div className="col-span-12 md:col-span-6 lg:col-span-4" key={beneficiary.id}>
                <Link passHref href={`/applications/${beneficiary.id}`}>
                  <a>
                    <CardBody
                      image={beneficiary?.application?.files?.headerImage}
                      {...beneficiary?.application}
                      stageDeadline={beneficiary.stageDeadline}
                      votes={beneficiary.votes}
                      status={beneficiary.status}
                      isApplication
                    />
                  </a>
                </Link>
              </div>
            ))
          )}
        </section>

        <div className="flex justify-center">
          <Button
            variant="tertiary"
            className="px-5 py-3 shadow-none"
            onClick={seeMore}
            disabled={proposals.length <= offset}
          >
            See more
          </Button>
        </div>
      </div>
    </section>
  );
};

export default index;
