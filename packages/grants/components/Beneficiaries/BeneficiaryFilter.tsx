import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface FilterProps {
  filterList: Array<string> | Array<{ name: string; link: string }>;
  selectedItem: string | { name: string; link: string };
  switchFilter: Function;
  position: string;
  width: string;
}

const BeneficiaryFilter: React.FC<FilterProps> = ({ filterList, switchFilter, position, width, selectedItem }) => {
  const checkActiveItem = (item: string | { name: string; link: string }) => {
    if (typeof selectedItem === "string") {
      return selectedItem === item;
    } else {
      return selectedItem.link === item.link;
    }
  };
  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      {/* absolute top-14 right-0 w-44 */}
      <Menu.Items
        className={`${position} ${width} bg-white rounded-2xl shadow-md border-gray-200 border focus:outline-none`}
      >
        {filterList.map((item, index: number) => (
          <Menu.Item key={index}>
            {({ active }) => (
              <a
                className={`${
                  active || checkActiveItem(item) ? "bg-gray-100 text-black-900" : "bg-white text-gray-500 "
                } group text-center px-2 py-4 block w-full cursor-pointer border-b border-gray-200 first:rounded-t-2xl last:rounded-b-2xl`}
                target="_blank"
                onClick={() => switchFilter(item)}
              >
                <p className="font-semibold leading-none">{typeof item === "string" ? item : item.name}</p>
              </a>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Transition>
  );
};

export default BeneficiaryFilter;
