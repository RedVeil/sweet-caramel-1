import { useState, useContext, useEffect } from "react";
import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import Image from "next/image";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import { BeneficiaryGrid } from "components/Beneficiaries/BeneficiaryGrid";
import { IpfsClient } from "@popcorn/utils";
import { ContractsContext } from "context/Web3/contracts";


export default function BeneficiaryIndexPage(): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { contracts } = useContext(ContractsContext);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<{ id: string; value: string }>({ id: "1", value: "All" });

  useEffect(() => {
    if (contracts?.beneficiaryRegistry) {
      setIsLoading(true);
      BeneficiaryRegistryAdapter(contracts.beneficiaryRegistry, IpfsClient)
        .getAllBeneficiaryApplications()
        .then((beneficiaries) => {
          setBeneficiaries(beneficiaries)
          setFilteredBeneficiaries(beneficiaries)
        }).finally(() => setIsLoading(false));
    }
  }, [contracts]);

  useEffect(() => {
    const filteringBeneficiaries = beneficiaries?.filter((beneficiary: BeneficiaryApplication) => {
      if (categoryFilter.value === "All") {
        return beneficiary;
      }
      return beneficiary?.proposalCategory?.toLowerCase() === categoryFilter.value.toLowerCase();
    });
    setFilteredBeneficiaries(filteringBeneficiaries);
  }, [categoryFilter]);


  return (
    <div className="px-6 lg:px-8">
      <section className="flex justify-between mt-4">
        <div>
          <h1 className="text-5xl lg:text-6xl text-black text-normal leading-[100%]">
            Eligible <br /> Beneficiaries
          </h1>
          <p className="text-primaryDark leading-[140%] text-base mt-2">
            Explore and learn more about our <br /> Eligible Beneficiaries.
          </p>
        </div>
        <div className="hidden lg:block">
          <Image src="/images/beneficiaryApplicationsHero.png" alt="smiley" height="360" width="640" />
        </div>
      </section>
      <section>
        <div className="flex flex-col md:flex-row justify-between relative md:mb-10">
          <div className="relative my-10 md:my-0">
            <BeneficiaryFilter
              categoryFilter={categoryFilter}
              switchFilter={setCategoryFilter}
            />
          </div>
        </div>
        <BeneficiaryGrid
          isLoading={isLoading}
          data={filteredBeneficiaries}
        />
      </section>
    </div>
  );
}
