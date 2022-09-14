import { Menu } from "@headlessui/react";
import { ViewGridIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import BeneficiaryPage from "components/Beneficiaries/BeneficiaryPage";
import FacebookPixel from "components/FacebookPixel";
import TutorialSlider from "components/Beneficiaries/TutorialSlider";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SecondaryActionButton from "components/SecondaryActionButton";
import Link from 'next/link';

export enum filterValues {
  all = "All",
  environment = "Environment",
  education = "Education ",
  inequality = "Inequality",
  openSource = "Open Source",
}
const filterList = [
  filterValues.all,
  filterValues.environment,
  filterValues.education,
  filterValues.inequality,
  filterValues.openSource,
];

const IndexPage = () => {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);
  const [categoryFilter, setCategoryFilter] = useState<string>(filterValues.all);

  const switchFilter = (value: string) => {
    setCategoryFilter(value);
  };
  return (
    <>
      <FacebookPixel />
      <section className="bg-customYellow p-6 md:p-8 rounded-lg">
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
            <img src="/images/hand.svg" alt="smiley" height="256" width="214" />
          </div>
        </div>
      </section>

      <section className="hidden md:block mt-20">
        <TutorialSlider isThreeX />
      </section>

      <section className="mt-20">
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

      <section className="mt-20">
        <div className="">
          <div className="flex justify-between relative">
            <h1 className="text-gray-900 font-semibold text-xl md:text-4xl mb-10">
              Eligible Beneficiaries At A Glance
            </h1>
            <div>
              <Menu>
                <Menu.Button className="bg-white rounded-3xl shadow-custom-lg">
                  <div className="w-32 md:w-44 cursor-pointer h-full py-3 px-5 flex flex-row items-center justify-between rounded-3xxl">
                    <div className="flex items-center">
                      <ViewGridIcon className="text-gray-400 w-3 h-3 md:w-5 md:h-5" />
                      <p className="text-xs md:text-sm font-medium ml-1 leading-none text-gray-400">
                        {categoryFilter}
                      </p>
                    </div>
                    <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <BeneficiaryFilter
                    filterList={filterList}
                    switchFilter={switchFilter}
                    position="absolute top-14 right-0 z-40"
                    width="w-44"
                    selectedItem={categoryFilter}
                  />
                </Menu.Button>
              </Menu>
            </div>
          </div>
          <BeneficiaryPage categoryFilter={categoryFilter} />
        </div>
      </section>
    </>
  );
};

export default IndexPage;
