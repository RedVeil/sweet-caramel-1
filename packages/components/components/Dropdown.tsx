import React, { Fragment } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Menu, Transition } from "@headlessui/react";

interface DropdownProps {
  options: Array<string> | { id: any; value: string }[];
  selectedItem: { id: any; value: string };
  switchFilter: (item: { id: any; value: string }) => void;
  position: string;
  width: string;
  label: string;
}

const Dropdown: React.FC<DropdownProps> = ({ position, selectedItem, width, options, switchFilter, label }) => {
  const checkActiveItem = (item: any) => {
    return selectedItem?.id ? selectedItem.id === item.id : false;
  };
  return (
    <Menu>
      <Menu.Button className="bg-transparent rounded-4xl border border-customLightGray border-opacity-60 relative px-6 py-4">
        <div className="cursor-pointer h-full flex flex-row items-center space-x-16 relative w-full text-[#55503D]">
          <div className="flex items-center">
            {/* {categoryFilter.value} */}
            <p className="leading-none text-secondaryDark">{label}</p>
          </div>
          <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
        </div>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className={`${position} ${width} rounded bg-white focus:outline-none`}>
          {options.map((item, index: number) => (
            <Menu.Item key={item.id}>
              {({ active }) => (
                <a
                  className={`${
                    active || checkActiveItem(item) ? "bg-warmGray text-black font-medium" : "bg-white text-[#55503D] "
                  } group px-6 py-4 block w-full h-full cursor-pointer border-gray-200 border-b border-x first:border-t first:rounded-t last:rounded-b text-left`}
                  target="_blank"
                  onClick={() => switchFilter(item)}
                >
                  <p className="leading-none">{item.value}</p>
                </a>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Dropdown;
