import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import { BeneficiaryGrid } from "components/Beneficiaries/BeneficiaryGrid";
import TutorialSlider from "components/Beneficiaries/TutorialSlider";
import FacebookPixel from "components/FacebookPixel";
import SecondaryActionButton from "components/SecondaryActionButton";
import { ContractsContext } from "context/Web3/contracts";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";

const IndexPage = () => {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<{ id: string; value: string }>({ id: "1", value: "All" });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { contracts } = useContext(ContractsContext);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<BeneficiaryApplication[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);

  useEffect(() => {
    if (contracts?.beneficiaryRegistry) {
      setIsLoading(true);
      BeneficiaryRegistryAdapter(contracts.beneficiaryRegistry, IpfsClient)
        .getAllBeneficiaryApplications()
        .then((beneficiaries) => {
          setBeneficiaries(beneficiaries);
          setFilteredBeneficiaries(beneficiaries);
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
        });
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
    <>
      <FacebookPixel />
      <div className="px-6 lg:px-8">
        <section className="bg-customYellow p-6 md:p-8 rounded-lg relative">
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

            <Link href="/applications" passHref>
              <a target="_blank">
                <div className="border-t border-customLightGray pt-2">
                  <SecondaryActionButton label="Participate Now" />
                </div>
              </a>
            </Link>
          </div>
        </section>

        <section className="relative">
          <div className="flex flex-col md:flex-row justify-between relative mb-5 md:mb-10">
            <h1 className="text-black font-normal text-base md:text-[36px] md:leading-[100%] mb-4 md:mb-0">
              Eligible Beneficiaries At A Glance
            </h1>
            {beneficiaries.length > 0 && (
              <BeneficiaryFilter categoryFilter={categoryFilter} switchFilter={setCategoryFilter} />
            )}
          </div>
          <BeneficiaryGrid isLoading={isLoading} data={filteredBeneficiaries} />
        </section>
      </div>
    </>
  );
};

export default IndexPage;
