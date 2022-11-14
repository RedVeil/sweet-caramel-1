import { Menu } from "@headlessui/react";
import { ViewGridIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import DropdownOptions from "@popcorn/app/components/Common/DropdownOptions";
import { MobilePopupSelect } from "@popcorn/app/components/Common/MobilePopupSelect";
import React, { FC } from "react";

interface IFilter {
  selectedItem: { id: string; value: string };
  setSelectedItem: (item: { id: string; value: string }) => void;
  categories: Array<{ id: string; value: string }>;
}

const CustomDropdown: FC<IFilter> = ({ selectedItem, setSelectedItem, categories }) => {
  const [openFilter, setOpenFilter] = React.useState(false);
  return (
    <>
      <div className="hidden md:block w-full">
        <Menu>
          <Menu.Button className="bg-white rounded-4xl border border-gray-300 relative w-full px-6 py-4">
            <div className="cursor-pointer h-full flex flex-row items-center justify-between relative w-full text-[#55503D]">
              <div className="flex items-center">
                <ViewGridIcon className="w-5 h-5 mr-3" />
                <p className="leading-none text-black">{selectedItem.value}</p>
              </div>
              <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <DropdownOptions
              options={categories}
              switchFilter={setSelectedItem}
              position="absolute top-16 left-0 z-40"
              width="w-full"
              borderRadius="rounded-3xl"
              borderRadiusFirstLast="first:rounded-t-3xl last:rounded-b-3xl"
              selectedItem={selectedItem.id}
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
            <p className="ml-1 leading-none text-black text-base">{selectedItem.value}</p>
          </div>
          <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="no-select-dot">
        <MobilePopupSelect
          categories={categories}
          visible={openFilter}
          onClose={setOpenFilter}
          selectedItem={selectedItem}
          switchFilter={setSelectedItem}
        />
      </div>
    </>
  );
};

export default CustomDropdown;
