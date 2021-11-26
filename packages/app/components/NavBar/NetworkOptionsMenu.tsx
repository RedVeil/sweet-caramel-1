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
      <Menu.Items className="absolute p-2 top-10 w-48 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <p className="mb-4 ml-3">Select a Network </p>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${active ? 'bg-gray-100' : 'bg-white'
                } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row justify-between w-full h-6 cursor-pointer h-10`}
              onClick={() => switchNetwork(1)}
            >
              <div className='w-4.5 h-4 object-contain ml-3' >
                <img src={"/images/icons/ethLogo.png"} alt={""} className='w-4.5 h-full' />
              </div>
              <div className='w-16'>Ethereum</div>
              {
                currentChain === 1 ?
                  <div className='mr-3 h-2 w-2 shadow-md rounded-2xl bg-green-400'></div> :
                  <div className='mr-3 h-2 w-2 rounded-2xl'></div>
              }
            </div>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${active ? 'bg-gray-100' : 'bg-white'
                } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row justify-between w-full h-6 cursor-pointer h-10`}
              onClick={() => switchNetwork(4)}
            >
              <div className='w-4.5 h-4 object-contain ml-3' >
                <img src={"/images/icons/ethLogo.png"} className='w-4.5 h-full' alt={""} />
              </div>
              <div className='w-16'>Rinkeby</div>
              {
                currentChain === 4 ?
                  <div className='mr-3 h-2 w-2 shadow-md rounded-2xl bg-green-400'></div> :
                  <div className='mr-3 h-2 w-2 rounded-2xl'></div>
              }
            </div>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${active ? 'bg-gray-100' : 'bg-white'
                } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row justify-between w-full h-6 cursor-pointer h-10`}
              onClick={() => switchNetwork(137)}
            >
              <div className='ml-3 w-4.5 h-4 '>
                <img src={"/images/icons/polygonLogo.png"} alt={""} />
              </div>
              <div className='w-16'>Polygon</div>
              {
                currentChain === 137 ?
                  <div className='mr-3 h-2 w-2 shadow-md rounded-2xl bg-green-400'></div> :
                  <div className='mr-3 h-2 w-2 rounded-2xl'></div>
              }

            </div>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${active ? 'bg-gray-100' : 'bg-white'
                } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row justify-between w-full h-6 cursor-pointer h-10`}
              onClick={() => switchNetwork(42161)}
            >
              <div className='w-4.5  ml-3'>
                <img src={"/images/icons/arbLogo.png"} alt={""} />
              </div>
              <div className='w-16'>Arbitrum</div>
              {
                currentChain === 42161 ?
                  <div className='mr-3 h-2 w-2 shadow-md rounded-2xl bg-green-400'></div> :
                  <div className='mr-3 h-2 w-2 rounded-2xl'></div>
              }
            </div>
          )}
        </Menu.Item>
      </Menu.Items>
    </Transition>
  );
};

export default NetworkOptionsMenu;
