import { Dialog, Transition } from "@headlessui/react";
import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import { BeneficiaryGrid } from "components/Beneficiaries/BeneficiaryGrid";
import TutorialSlider from "components/Beneficiaries/TutorialSlider";
import FacebookPixel from "components/FacebookPixel";
import MobileTutorialSlider from "components/MobileTutorialSlider";
import SecondaryActionButton from "components/SecondaryActionButton";
import { RightArrowIcon } from "components/Svgs";
import { ContractsContext } from "context/Web3/contracts";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useContext, useEffect, useState } from "react";

const IndexPage = () => {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<{ id: string; value: string }>({ id: "1", value: "All" });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { contracts } = useContext(ContractsContext);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<BeneficiaryApplication[]>([]);
  const [showMobileTutorial, toggleMobileTutorial] = useState<boolean>(false);

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
        <div className="grid grid-cols-12 md:gap-8">
          <div className="col-span-12 md:col-span-7">
            <section className="bg-landing-page bg-cover p-6 md:p-8 rounded-lg relative h-[386px] md:h-full">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <h2 className="text-6xl text-white leading-[100%]">
                    Popcorn <br /> Grants
                  </h2>
                  <p className="mt-2 leading-6 text-customLightGray">
                    Social impact driven by the people for <br /> the people
                  </p>
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex w-full">
                    <div className="mr-10">
                      <p className="capitalize text-customLightGray leading-5 md:leading-6">Eligible beneficiaries</p>
                      <h1 className=" text-2xl md:text-6xl text-white leading-[100%]">240</h1>
                    </div>
                    <div>
                      <p className="capitalize text-customLightGray leading-5 md:leading-6">total funds raised</p>
                      <h1 className=" text-2xl md:text-6xl text-white leading-[100%]">$500k</h1>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="col-span-12 md:col-span-5">
            <section className="hidden md:block">
              <TutorialSlider />
            </section>
            <div className="md:hidden mt-10">
              <div
                className="bg-customPink rounded-lg w-full px-6 py-6 text-white flex justify-between items-center"
                role="button"
                onClick={() => toggleMobileTutorial(true)}
              >
                <p className="text-medium">Learn How It Works</p>
                <RightArrowIcon color="fff" />
              </div>
            </div>

            <section className="mt-8">
              <div className="rounded-lg border border-customLightGray p-6 pb-4 col-span-12 md:col-span-6">
                <div className="flex gap-6 items-center pb-6">
                  <div>
                    <h2 className="text-black leading-[100%] text-3xl">Beneficiary Applications</h2>
                    <p className="text-primaryDark text-base leading-6 mt-4">
                      Vote for any proposal to become an eligible beneficiary
                    </p>
                  </div>
                </div>

                <Link href="/applications" passHref target="_blank">
                  <div className="border-t border-customLightGray pt-2">
                    <SecondaryActionButton label="Participate Now" />
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>

        <section className="relative mt-12 md:mt-24">
          <div className="flex flex-col md:flex-row justify-between relative mb-5 md:mb-10">
            <h1 className="text-black font-normal text-base md:text-[36px] md:leading-[100%] mb-4 md:mb-0">
              Eligible Beneficiaries At A Glance
            </h1>
            {beneficiaries.length > 0 && (
              <BeneficiaryFilter
                categoryFilter={categoryFilter}
                switchFilter={setCategoryFilter}
                filterPosition="right"
              />
            )}
          </div>
          <BeneficiaryGrid isLoading={isLoading} data={filteredBeneficiaries} />
        </section>
      </div>

      <Transition.Root show={showMobileTutorial} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 overflow-hidden z-40" onClose={() => toggleMobileTutorial(false)}>
          <Dialog.Overlay className="absolute inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-700"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen">
                <MobileTutorialSlider onCloseMenu={() => toggleMobileTutorial(false)} />
              </div>
            </Transition.Child>
          </Dialog.Overlay>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default IndexPage;
