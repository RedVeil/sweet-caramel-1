import { Menu } from "@headlessui/react";
import { ViewGridIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import Beneficiaries from "components/Beneficiaries/Beneficiaries";
import FacebookPixel from "components/FacebookPixel";
import TutorialSlider from "components/Beneficiaries/TutorialSlider";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SecondaryActionButton from "components/SecondaryActionButton";
import Link from 'next/link';
import Image from "next/image";
import { MobileBeneficiaryCategoryFilter } from "components/Beneficiaries/MobileBeneficiaryCategoryFilter";
import Button from "components/CommonComponents/Button";

export enum filterValues {
  all = "All",
  environment = "Environment",
  education = "Education ",
  inequality = "Inequality",
  openSource = "Open Source",
}

const categories = [
  {
    id: '1',
    value: filterValues.all,
  },
  {
    id: '2',
    value: filterValues.environment,
  },
  {
    id: '3',
    value: filterValues.education,
  },
  {
    id: '4',
    value: filterValues.inequality,
  },
  {
    id: '5',
    value: filterValues.openSource,
  }
]

const IndexPage = () => {
  const router = useRouter();
  const [showBeneficiaryCategories, setShowBeneficiaryCategories] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.replace(window.location.pathname);
    }
  }, [router.pathname]);
  const [categoryFilter, setCategoryFilter] = useState<{ id: string, value: string }>(categories[0]);

  const switchFilter = (value: { id: string, value: string }) => {
    setCategoryFilter(value);
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
              <p className="leading-[140%] text-base text-primaryDark">Eligible <br /> Beneficiaries</p>
              <h2 className="text-2xl text-black leading-[110%]">240</h2>
            </div>
            <div>
              <p className="leading-[140%] text-base text-primaryDark">Total Fund <br /> Raised</p>
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
          <h1 className="text-black font-normal text-base md:text-[36px] md:leading-[100%]">
            Eligible Beneficiaries At A Glance
          </h1>
          <div className="hidden md:block">
            <Menu>
              <Menu.Button className="bg-white rounded-4xl border border-[#E5E7EB]">
                <div className="w-44 cursor-pointer h-full py-3 px-5 flex flex-row items-center justify-between">
                  <div className="flex items-center">
                    <ViewGridIcon className="text-gray-400 w-3 h-3 md:w-5 md:h-5" />
                    <p className="text-xs md:text-sm font-medium ml-1 leading-none text-gray-400">
                      {categoryFilter.value}
                    </p>
                  </div>
                  <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
                </div>
                <BeneficiaryFilter
                  filterList={categories}
                  switchFilter={switchFilter}
                  position="absolute top-14 right-0 z-40"
                  width="w-44"
                  selectedItem={categoryFilter.id}
                />
              </Menu.Button>
            </Menu>
          </div>
          <div className="block md:hidden mt-5">
            <button
              onClick={() => setShowBeneficiaryCategories(true)}
              className="w-full py-3 px-5  flex flex-row items-center justify-between rounded-4xl border border-[#E5E7EB]"
            >
              <div className="flex items-center">
                <ViewGridIcon className="text-gray-400 w-3 h-3 md:w-5 md:h-5" />
                <p className="text-xs md:text-sm font-medium ml-1 leading-none text-gray-400">
                  {categoryFilter.value}
                </p>
              </div>
              <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <MobileBeneficiaryCategoryFilter
          categories={categories}
          visible={showBeneficiaryCategories}
          onClose={setShowBeneficiaryCategories}
          selectedItem={categoryFilter}
          switchFilter={switchFilter}
        />
        <Beneficiaries categoryFilter={categoryFilter.value} />
      </section>
    </>
  );
};

export default IndexPage;
