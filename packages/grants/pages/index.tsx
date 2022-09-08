import { Menu } from "@headlessui/react";
import { ViewGridIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import BeneficiaryFilter from "components/Beneficiaries/BeneficiaryFilter";
import BeneficiaryPage from "components/Beneficiaries/BeneficiaryPage";
import Hero from "components/Beneficiaries/Hero";
import HowItWorksDropdown from "components/Beneficiaries/HowItWorksDropdown";
import FacebookPixel from "components/FacebookPixel";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
      <main className="w-full">
        <FacebookPixel />
        <Hero />
        <HowItWorksDropdown />
        <section className="container mx-auto font-normal">
          <div className="px-5 lg:px-10 py-20">
            <div className="grid grid-cols-12 gap-y-10 md:gap-5 lg:gap-10">
              <div className="col-span-12 md:col-span-6 transition duration-500 ease-in-out transform hover:scale-102">
                <div className="rounded-3xl flex flex-col items-center py-10 px-16 md:px-10 lg:px-14 text-center shadow-custom-md md:h-110 lg:h-96">
                  <img src="/images/illustration _ do well.png" alt="" className="mb-10" />
                  <p className="text-gray-900 font-semibold text-3xl mb-4">Beneficiary Applications</p>
                  <p className="text-gray-500 text-xl mb-4">Vote for any proposal to become an eligible beneficiary</p>
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 transition duration-500 ease-in-out transform hover:scale-102">
                <div className="rounded-3xl flex flex-col items-center py-10 px-16 md:px-10 lg:px-14 text-center shadow-custom-md md:h-110 lg:h-96">
                  <img src="/images/illustration _ do good.png" alt="" className="mb-10" />
                  <p className="text-gray-900 font-semibold text-3xl mb-4">Grant Elections</p>
                  <p className=" text-gray-500 text-xl mb-4">
                    Vote for eligible beneficiaries so they can win a chance to be funded
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 lg:px-10 py-20">
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
      </main>
    </>
  );
};

export default IndexPage;
