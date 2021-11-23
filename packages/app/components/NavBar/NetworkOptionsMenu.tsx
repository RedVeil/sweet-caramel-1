import { Menu, Transition } from '@headlessui/react';
import React, { Fragment } from 'react';

interface NetworkOptionsMenuProps {
  currentChain: number;
  switchNetwork: (chainId: number) => void;
}

const NetworkOptionsMenu: React.FC<NetworkOptionsMenuProps> = ({
  currentChain,
  switchNetwork,
  ...props
}) => {
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
      <Menu.Items className="absolute p-5 top-10 w-48 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <p className="mb-4">Select a Network </p>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${
                active ? 'bg-gray-100' : 'bg-white'
              } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row space-between w-full h-6 cursor-pointer h-10`}
              onClick={() => switchNetwork(1)}
            >
              <div className="">
                <img />
              </div>
              <div>Ethereum</div>
              <div></div>
            </div>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${
                active ? 'bg-gray-100' : 'bg-white'
              } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row space-between w-full h-6 cursor-pointer h-10`}
              onClick={() => switchNetwork(4)}
            >
              <div className="">
                <img />
              </div>
              <div>Rinkeby</div>
              <div></div>
            </div>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${
                active ? 'bg-gray-100' : 'bg-white'
              } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row space-between w-full h-6 cursor-pointer h-10`}
              onClick={() => switchNetwork(137)}
            >
              <div className="">
                <img />
              </div>
              <div>Polygon</div>
              <div>
                <img />
              </div>
            </div>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${
                active ? 'bg-gray-100' : 'bg-white'
              } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row space-between w-full h-6 cursor-pointer h-10`}
              onClick={() => switchNetwork(42161)}
            >
              <div className="">
                <img />
              </div>
              <div>Arbitrum</div>
              <div>
                <img />
              </div>
            </div>
          )}
        </Menu.Item>
      </Menu.Items>
    </Transition>
  );
};

export default NetworkOptionsMenu;
