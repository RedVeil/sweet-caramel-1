import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import BeneficiaryOptions from "components/Beneficiaries/BeneficiaryOptions";
import React, { FC } from "react";
import { MobilePopupSelect } from "./MobilePopupSelect";

interface IFilter {
  categoryFilter: { id: string; value: string };
  switchFilter: (item: { id: string; value: string }) => void;
  categories: Array<{ id: string; value: string }>;
  children: JSX.Element | JSX.Element[];
}

const CustomDropdown: FC<IFilter> = ({ categoryFilter, switchFilter, categories, children }) => {
  const [openFilter, setOpenFilter] = React.useState(false);
  return (
    <>
      <div className="hidden md:block">
        <Menu>
          <Menu.Button className="bg-white rounded border border-gray-300 relative w-full">
            <div className="cursor-pointer h-full py-3 px-3 flex flex-row items-center justify-between relative w-full">
              <div className="flex items-center">
                <p className="leading-none text-black">{categoryFilter.value}</p>
              </div>
              <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <BeneficiaryOptions
              options={categories}
              switchFilter={switchFilter}
              position="absolute top-12 left-0 z-40"
              width="w-full"
              selectedItem={categoryFilter.id}
            />
          </Menu.Button>
        </Menu>
      </div>
      <div className="block md:hidden">
        <button
          onClick={(e) => {
            e.preventDefault();
            setOpenFilter(true);
          }}
          className="w-full py-3 px-5 flex flex-row items-center justify-between mt-1 space-x-1 rounded border border-gray-300"
        >
          <div className="flex items-center">
            <p className="ml-1 leading-none text-black text-base">{categoryFilter.value}</p>
          </div>
          <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="no-select-dot">
        <MobilePopupSelect
          categories={categories}
          visible={openFilter}
          onClose={setOpenFilter}
          selectedItem={categoryFilter}
          switchFilter={switchFilter}
        />
      </div>
    </>
  );
};

export default CustomDropdown;
