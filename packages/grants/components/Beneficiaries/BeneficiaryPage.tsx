import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import Button from "components/CommonComponents/Button";
import { CardLoader } from "components/CommonComponents/CardLoader";
import NotFoundError from "components/CommonComponents/NotFoundError";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import CardBody from "../../components/CommonComponents/CardBody";
import { ContractsContext } from "../../context/Web3/contracts";
export interface BeneficiaryPageProps {
  categoryFilter: string;
}

const BeneficiaryPage: React.FC<BeneficiaryPageProps> = ({ categoryFilter }): JSX.Element => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { contracts } = useContext(ContractsContext);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [offset, setOffset] = useState<number>(9);

  useEffect(() => {
    if (contracts?.beneficiaryRegistry) {
      setIsLoading(true);
      BeneficiaryRegistryAdapter(contracts.beneficiaryRegistry, IpfsClient)
        .getAllBeneficiaryApplications()
        .then((beneficiaries) => {
          setBeneficiaries(beneficiaries);
          setFilteredBeneficiaries(beneficiaries.slice(0, offset));
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
        });
    }
  }, [contracts]);

  useEffect(() => {
    const filteringBeneficiaries = beneficiaries?.filter((beneficiary: BeneficiaryApplication) => {
      if (categoryFilter === "All") {
        return beneficiary;
      }
      return beneficiary?.proposalCategory?.toLowerCase() === categoryFilter.toLowerCase();
    });
    setFilteredBeneficiaries(filteringBeneficiaries);
  }, [categoryFilter]);

  const seeMore = () => {
    let newOffset = offset + 9;
    setOffset(newOffset);
    setFilteredBeneficiaries(beneficiaries.slice(0, newOffset));
  };
  return (
    <>
      <section className="grid grid-cols-12 py-20 gap-y-10 md:gap-10">
        {isLoading &&
          [1, 2, 3].map((i) => (
            <div className="col-span-12 md:col-span-6 lg:col-span-4" key={i}>
              <CardLoader key={i} />
            </div>
          ))}
        {!isLoading && filteredBeneficiaries?.length <= 0 ? (
          <div className="col-span-12">
            <NotFoundError
              image="/images/emptyBeneficiariesState.svg"
              title="There are no Eligible Beneficiaries at this moment"
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
          filteredBeneficiaries.map((beneficiary, index) => (
            <div className="col-span-12 md:col-span-6 lg:col-span-4" key={index}>
              <Link passHref href={`/beneficiaries/${beneficiary.beneficiaryAddress}`}>
                <a>
                  <CardBody image={beneficiary?.files?.headerImage} {...beneficiary} />
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
          disabled={beneficiaries.length <= offset}
        >
          See more
        </Button>
      </div>
    </>
  );
};
export default BeneficiaryPage;
