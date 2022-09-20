import { Menu } from "@headlessui/react";
import { ViewGridIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import BeneficiaryOptions from "components/Beneficiaries/BeneficiaryOptions";
import { filterValues } from "pages";
import { useState } from "react";
import Image from "next/image";

const filterList = [
  filterValues.all,
  filterValues.education,
  filterValues.inequality,
  filterValues.openSource,
];

export default function BeneficiaryIndexPage(): JSX.Element {
  const [categoryFilter, setCategoryFilter] = useState<string>(filterValues.all);
  const switchFilter = (value: string) => {
    setCategoryFilter(value);
  };

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
      <section className="container mx-auto">
        <div className="px-5 pt-32 pb-10 md:px-10">
          <h1 className="text-center md:text-left text-gray-900 font-semibold text-3xl md:text-5xl mb-2">
            Eligible Beneficiaries
          </h1>
          <p className=" text-center md:text-left text-lg md:text-2xl text-gray-900">
            Explore and learn more about our Eligible Beneficiaries.
          </p>

          <div className="flex justify-center md:justify-start relative pt-32">
            <Menu>
              <Menu.Button className="bg-white rounded-3xl shadow-custom-lg">
                <div className="w-32 md:w-44 cursor-pointer h-full py-3 px-5 flex flex-row items-center justify-between rounded-3xxl">
                  <div className="flex items-center">
                    <ViewGridIcon className="text-gray-400 w-3 h-3 md:w-5 md:h-5" />
                    <p className="text-xs md:text-sm font-medium ml-1 leading-none text-gray-400">{categoryFilter}</p>
                  </div>
                  <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
                </div>
                <BeneficiaryOptions
                  options={filterList}
                  switchFilter={switchFilter}
                  position="absolute top-36 left-1/2 transform -translate-x-1/2 md:left-0 md:translate-x-0 z-40"
                  width="w-44"
                  selectedItem={categoryFilter}
                />
              </Menu.Button>
            </Menu>
          </div>
          {/* <BeneficiaryPage categoryFilter={categoryFilter} /> */}
        </div>
      </section>
    </div>
  );
}
