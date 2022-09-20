import { Menu } from "@headlessui/react";
import { ViewGridIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import BeneficiaryOptions from "components/Beneficiaries/BeneficiaryOptions";
import React, { FC } from "react";
import { MobilePopupSelect } from "../CommonComponents/MobilePopupSelect";

export enum filterValues {
  all = "All",
  environment = "Environment",
  education = "Education ",
  inequality = "Inequality",
  openSource = "Open Source",
}

export const categories = [
  {
    id: "1",
    value: filterValues.all,
  },
  {
    id: "2",
    value: filterValues.environment,
  },
  {
    id: "3",
    value: filterValues.education,
  },
  {
    id: "4",
    value: filterValues.inequality,
  },
  {
    id: "5",
    value: filterValues.openSource,
  },
];

interface IFilter {
  categoryFilter: { id: string; value: string };
  switchFilter: (item: { id: string; value: string }) => void;
  isApplication?: boolean;
}

const BeneficiaryFilter: FC<IFilter> = ({ categoryFilter, switchFilter, isApplication }) => {
  const [openFilter, setOpenFilter] = React.useState(false);
  return (
    <>
      <div className="hidden md:block">
        <Menu>
          <Menu.Button className="bg-white rounded-4xl border border-[#E5E7EB]">
            <div className="w-44 cursor-pointer h-full py-3 px-5 flex flex-row items-center justify-between relative">
              <div className="flex items-center">
                <ViewGridIcon className="text-gray-400 w-3 h-3 md:w-5 md:h-5" />
                <p className="text-xs md:text-sm font-medium ml-1 leading-none text-gray-400">{categoryFilter.value}</p>
              </div>
              <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <BeneficiaryOptions
              options={categories}
              switchFilter={switchFilter}
              position="absolute top-14 right-0 z-40"
              width="w-44"
              selectedItem={categoryFilter.id}
            />
          </Menu.Button>
        </Menu>
      </div>
      <div className="block md:hidden">
        <button
          onClick={() => setOpenFilter(true)}
          className={`w-full py-3 px-5 flex flex-row items-center justify-center space-x-1 rounded-4xl border border-[#E5E7EB] ${
            isApplication ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center">
            <ViewGridIcon className="text-primaryDark w-5 h-5" />
            <p className="font-medium ml-1 leading-none text-primaryDark">{categoryFilter.value}</p>
          </div>
          <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <MobilePopupSelect
        categories={categories}
        visible={openFilter}
        onClose={setOpenFilter}
        selectedItem={categoryFilter}
        switchFilter={switchFilter}
      />
    </>
  );
};

export default BeneficiaryFilter;
