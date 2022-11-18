import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface FilterProps {
  filterList: Array<{ name: string; link: string }> | Array<string>;
  switchFilter: Function;
  position: string;
  width: string;
}

const MobileBeneficiaryFilter: React.FC<FilterProps> = ({ filterList, switchFilter, position, width }) => {
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
      <Menu.Items className={`${position} ${width} bg-white focus:outline-none`}>
        {filterList.map((item, index) => (
          <Menu.Item key={index}>
            {({ active }) => (
              <a
                className={`${active ? "bg-gray-100" : "bg-white"
                  } group text-left py-4 block w-full cursor-pointer first:rounded-t-2xl last:rounded-b-2xl`}
                target="_blank"
                onClick={() => switchFilter(item)}
              >
                <p className="text-gray-500 font-semibold leading-none">
                  {typeof item === "string" ? item : item.name}
                </p>
              </a>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Transition>
  );
};

export default MobileBeneficiaryFilter;
