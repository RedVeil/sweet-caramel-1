import { FilterIcon } from "@heroicons/react/outline";
import { BeneficiaryGovernanceAdapter, Proposal, ProposalStatus, ProposalType } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import { BeneficiaryGrid } from "components/Beneficiaries/BeneficiaryGrid";
import Button from "components/CommonComponents/Button";
import PopUpModal from "components/Modal/PopUpModal";
import { ContractsContext } from "context/Web3/contracts";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const INITIAL_OFFSET = 9;

const BeneficiaryApplications = () => {
  const switchFilter = (value: { id: string; value: string }) => {
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
  const [categoryFilter, setCategoryFilter] = useState<{ id: string; value: string }>({ id: "1", value: "All" });
  const [statusFilter, setStatusFilter] = useState(applicationTypes[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(INITIAL_OFFSET);
  const [openMobileFilter, setOpenMobileFilter] = useState<boolean>(false);

  useEffect(() => {
    if (contracts?.beneficiaryGovernance) {
      setIsLoading(true);
      new BeneficiaryGovernanceAdapter(contracts?.beneficiaryGovernance, IpfsClient)
        .getAllProposals(ProposalType.Nomination)
        .then((res) => {
          const sortedProposals = res.sort(sortProposals);
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
        if (statusFilter.status === ProposalStatus.Completed) {
          return proposalStatus === ProposalStatus.Passed || proposalStatus === ProposalStatus.Failed;
        }
        return proposalStatus === statusFilter.status || statusFilter.status === ProposalStatus.All;
      })
      ?.filter((proposal: Proposal) => {
        if (categoryFilter.value === "All") {
          return proposal;
        }
        return proposal.application?.proposalCategory?.toLowerCase() === categoryFilter.value.toLowerCase();
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
    <>
      <section className="flex justify-between mt-4 px-6 lg:px-8">
        <div>
          <h1 className="text-5xl lg:text-6xl text-black text-normal leading-[100%]">
            Beneficiary <br /> Applications
          </h1>
          <p className="lg:hidden text-black leading-[140%] text-base mt-2">
            Vote for any eligible beneficiary’s proposal
          </p>
        </div>
        <div className="hidden lg:block">
          <Image src="/images/beneficiaryApplicationsHero.png" alt="smiley" height="360" width="640" />
        </div>
      </section>

      <section className="pt-12 lg:pt-20 px-6 lg:px-8">
        <div className="flex justify-between pb-10 relative items-center">
          {/* category filter */}
          <div className="relative w-1/2 pr-2">
            <BeneficiaryFilter categoryFilter={categoryFilter} switchFilter={switchFilter} isApplication />
          </div>

          {/* status filter */}
          <div className="w-1/2 lg:w-auto pl-2 lg:pl-0">
            <div className="hidden md:flex space-x-4">
              {applicationTypes.map((type) => (
                <Button
                  key={type.status}
                  variant={type.status === statusFilter.status ? "primary" : "secondary"}
                  onClick={() => setStatusFilter(type)}
                  className="!border-[#E5E7EB]"
                >
                  {type.label}
                </Button>
              ))}
            </div>
            <div className="block md:hidden">
              <Button
                variant="primary"
                onClick={() => setOpenMobileFilter(true)}
                className="w-full !text-base !items-center"
              >
                <FilterIcon className="h-5 w-5" />
                {statusFilter.label === "Challenge Period" ? "Challenge" : statusFilter.label}
              </Button>
            </div>
          </div>
        </div>
        <BeneficiaryGrid
          isLoading={isLoading}
          beneficiaries={filteredProposals}
          isApplication
          offset={offset}
          seeMore={seeMore}
        />
      </section>

      <PopUpModal visible={openMobileFilter} onClosePopUpModal={() => setOpenMobileFilter(false)}>
        <>
          <p className="text-black mb-3">Filters</p>
          <div className="grid grid-cols-6 gap-3">
            {applicationTypes.map((type) => (
              <div className="col-span-3" key={type.status}>
                <Button
                  variant={type.status === statusFilter.status ? "primary" : "secondary"}
                  onClick={() => {
                    setStatusFilter(type);
                    setOpenMobileFilter(false);
                  }}
                  className="!border-[#E5E7EB] !text-sm w-full"
                >
                  {type.label === "Challenge Period" ? "Challenge" : type.label}
                </Button>
              </div>
            ))}
          </div>
        </>
      </PopUpModal>
    </>
  );
};

export default BeneficiaryApplications;
