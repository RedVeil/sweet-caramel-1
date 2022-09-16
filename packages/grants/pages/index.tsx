
import FacebookPixel from "components/FacebookPixel";
import TutorialSlider from "components/Beneficiaries/TutorialSlider";
import { useRouter } from "next/router";
import { useEffect, useState, useContext } from "react";
import SecondaryActionButton from "components/SecondaryActionButton";
import Link from 'next/link';
import { IpfsClient } from "@popcorn/utils";
import Image from "next/image";
import { ContractsContext } from "context/Web3/contracts";
import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import { BeneficiaryGrid } from "components/Beneficiaries/BeneficiaryGrid";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import Button from "components/CommonComponents/Button";

export enum filterValues {
  all = "All",
  environment = "Environment",
  education = "Education ",
  inequality = "Inequality",
  openSource = "Open Source",
}

const INITIAL_OFFSET = 9

const IndexPage = () => {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<{ id: string, value: string }>({ id: '1', value: "All" });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { contracts } = useContext(ContractsContext);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [offset, setOffset] = useState<number>(INITIAL_OFFSET);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);

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

      if (categoryFilter.value === "All") {
        return beneficiary;
      }
      return beneficiary?.proposalCategory?.toLowerCase() === categoryFilter.value.toLowerCase();
    });
    setOffset(INITIAL_OFFSET);
    setFilteredBeneficiaries(filteringBeneficiaries?.slice(0, INITIAL_OFFSET));
  }, [categoryFilter]);

  const switchFilter = (value: { id: string; value: string }) => {
    setCategoryFilter(value);
  };

  const seeMore = () => {
    const newOffset = offset + INITIAL_OFFSET;
    setOffset(newOffset);
    setFilteredBeneficiaries(beneficiaries.slice(0, newOffset));
  };

  return (
    <>
      <FacebookPixel />
      <section className="bg-customYellow p-6 md:p-8 rounded-lg relative">
        <div className="absolute left-1/2 -top-[12px] transform -translate-x-1/2 -translate-y-[12px] hidden lg:block">
          <Link href="/applications" passHref>
            <Button variant="primary">
              Beneficiary Applications
            </Button>
          </Link>
        </div>
        <div className="hidden md:block">
          <div className="flex w-full justify-end">
            <div className="mr-10">
              <p className="capitalize text-primaryDark">Eligible beneficiaries</p>
              <h1 className="text-6xl text-black leading-[100%]">240</h1>
            </div>
            <div>
              <p className="capitalize text-primaryDark">total funds raised</p>
              <h1 className="text-6xl text-black leading-[100%]">500k USD</h1>
            </div>
          </div>
          <div className="flex justify-between items-end mt-[108px]">
            <div>
              <h2 className="text-6xl text-black leading-[100%]">
                Popcorn <br /> Beneficiaries
              </h2>
              <p className="mt-2 leading-[140%] text-primaryDark">
                Social impact driven by the people for <br /> the people
              </p>
            </div>
            <div>
              <Image src="/images/hand.svg" alt="smiley" height="256" width="214" />
            </div>
          </div>
        </div>
        <div className="block md:hidden">
          <h2 className="text-4xl text-black leading-[100%]">
            Popcorn <br /> Beneficiaries
          </h2>
          <p className="mt-2 leading-[140%] text-primaryDark">
            Social impact driven by the people for <br /> the people
          </p>
          <div className="flex justify-between items-start my-10">
            <div>
              <p className="leading-[140%] text-base text-primaryDark">
                Eligible <br /> Beneficiaries
              </p>
              <h2 className="text-2xl text-black leading-[110%]">240</h2>
            </div>
            <div>
              <p className="leading-[140%] text-base text-primaryDark">
                Total Fund <br /> Raised
              </p>
              <h2 className="text-2xl text-black leading-[110%]">500k USD</h2>
            </div>
          </div>
          <div className="flex justify-end">
            <Image src="/images/hand.svg" alt="smiley" height="47" width="47" />
          </div>
        </div>
      </section>

      <section className="hidden md:block mt-20">
        <TutorialSlider isThreeX />
      </section>

      <section className="my-12 md:my-20">
        <div className="rounded-lg border border-customLightGray p-6 pb-4 col-span-12 md:col-span-6">
          <div className="flex gap-6 items-center pb-6">
            <div>
              <h2 className="text-black leading-[100%] text-3xl">Beneficiary Applications</h2>
              <p className="text-primaryDark text-base leading-6 mt-4">
                Vote for any proposal to become an <br />
                eligible beneficiary
              </p>
            </div>
          </div>

          <Link href="/rewards" passHref>
            <a target="_blank">
              <div className="border-t border-customLightGray pt-2 px-1">
                <SecondaryActionButton label="Participate Now" />
              </div>
            </a>
          </Link>
        </div>
      </section>

      <section>
        <div className="flex flex-col md:flex-row justify-between relative mb-5 md:mb-10">
          <h1 className="text-black font-normal text-base md:text-[36px] md:leading-[100%] mb-4 md:mb-0">
            Eligible Beneficiaries At A Glance
          </h1>
          <BeneficiaryFilter
            categoryFilter={categoryFilter}
            switchFilter={switchFilter}
          />
        </div>
        <BeneficiaryGrid
          isLoading={isLoading}
          beneficiaries={filteredBeneficiaries}
          offset={offset}
          seeMore={seeMore}
        />
      </section>
    </>
  );
};

export default IndexPage;
