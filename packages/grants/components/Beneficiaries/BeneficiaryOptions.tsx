import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface FilterProps {
  options: Array<string> | { [key: string]: string }[];
  selectedItem: string | { name: string; link: string };
  switchFilter: (item: string | { [key: string]: string }) => void;
  position: string;
  width: string;
}

const BeneficiaryOptions: React.FC<FilterProps> = ({ options, switchFilter, position, width, selectedItem }) => {

  const checkActiveItem = (item: any) => {
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
        {options.map((item, index: number) => (
          <Menu.Item key={index}>
            {({ active }) => (
              <a
                target="_blank"
                onClick={() => switchFilter(item)} className="font-normal text-primary bg-white group text-left px-6 py-4 block w-full cursor-pointer border-b hover:bg-warmGray hover:border-warmGray first:rounded-t-2xl last:rounded-b-2xl last:border-0 hover:text-black hover:font-[500]"
              >
                <p className="leading-none text-lg whitespace-nowrap">{typeof item === "string" ? item : (item.name || item.value)}</p>
              </a>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Transition>
  );
};

export default BeneficiaryOptions;
