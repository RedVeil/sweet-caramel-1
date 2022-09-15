import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import Button from "components/CommonComponents/Button";
import { CardLoader } from "components/CommonComponents/CardLoader";
import NotFoundError from "components/CommonComponents/NotFoundError";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import CardBody from "../../components/CommonComponents/CardBody";
import { ContractsContext } from "../../context/Web3/contracts";

const INITIAL_OFFSET = 9
export interface BeneficiaryPageProps {
  categoryFilter: string;
}

const Beneficiaries: React.FC<BeneficiaryPageProps> = ({ categoryFilter }): JSX.Element => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { contracts } = useContext(ContractsContext);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [offset, setOffset] = useState<number>(INITIAL_OFFSET);

  useEffect(() => {
    if (contracts?.beneficiaryRegistry) {
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
    setIsLoading(false);
  }, [contracts]);

  useEffect(() => {
    const filteringBeneficiaries = beneficiaries?.filter((beneficiary: BeneficiaryApplication) => {

      if (categoryFilter === "All") {
        return beneficiary;
      }
      return beneficiary?.proposalCategory?.toLowerCase() === categoryFilter.toLowerCase();
    });
    setOffset(INITIAL_OFFSET);
    setFilteredBeneficiaries(filteringBeneficiaries?.slice(0, INITIAL_OFFSET));
  }, [categoryFilter]);

  const seeMore = () => {
    const newOffset = offset + INITIAL_OFFSET;
    setOffset(newOffset);
    setFilteredBeneficiaries(beneficiaries.slice(0, newOffset));
  };

  return (
    <>
      <div className="grid grid-cols-12 pb-10 md:pb-20 gap-y-10 md:gap-10">
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
      </div>
      {filteredBeneficiaries?.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={seeMore}
            disabled={beneficiaries.length <= offset}
          >
            See more
          </Button>
        </div>
      )}
    </>
  );
};
export default Beneficiaries;
