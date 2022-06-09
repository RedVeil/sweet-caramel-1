import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface GetPopMenuProps {
  options: Array<{ title: string; onClick: () => void; currentlySelected: boolean }>;
}

const DropDownComponent: React.FC<GetPopMenuProps> = ({ options }) => {
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
      <Menu.Items className="md:absolute mt-6 md:mt-0 md:top-8 md:w-44 md:-left-12 bg-white rounded-2xl md:shadow-md md:border-gray-200 md:border focus:outline-none">
        {options.map((option, index, { length }) => {
          return (
            <Menu.Item key={option.title}>
              {({ active }) => (
                <div
                  className={`group text-left md:flex md:flex-col md:justify-center md:text-center mb-4 md:mb-0 ml-2 md:ml-0 md:px-6 md:h-14 cursor-pointer md:border-b md:border-gray-200 last:border-0
                  ${index === 0 ? "rounded-t-2xl" : ""} 
                  ${length - 1 === index ? "rounded-b-2xl" : ""} 
                  ${active ? "md:bg-gray-100" : "md:bg-white"} `}
                  onClick={option.onClick}
                >
                  <p
                    className={`whitespace-nowrap leading-none text-lg text-gray-500 md:text-gray-900 font-medium ${
                      option.currentlySelected ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {option.title}
                  </p>
                </div>
              )}
            </Menu.Item>
          );
        })}
      </Menu.Items>
    </Transition>
  );
};

export default DropDownComponent;
