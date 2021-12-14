import { Menu } from '@headlessui/react';
import { store } from 'context/store';
import React, { useContext } from 'react';
import { ChainId, logos, networkMap } from '../../context/Web3/connectors';

interface NetworkOptionsMenuItemProps {
  chainId: ChainId;
  currentChainId: number;
  switchNetwork: (chainId: number, dispatch: React.Dispatch<any>) => void;
  last?: boolean;
}

const NetworkOptionsMenuItem: React.FC<NetworkOptionsMenuItemProps> = ({
  chainId,
  switchNetwork,
  currentChainId,
  last,
  ...props
}) => {
  const { dispatch } = useContext(store);
  return (
    <Menu.Item>
      {({ active }) => (
        <div
          className={`${
            active ? 'bg-gray-100' : 'bg-white'
          } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row justify-between w-full h-12 cursor-pointer ${
            last ? 'rounded-b-3xl ' : ''
          }`}
          onClick={() => switchNetwork(chainId, dispatch)}
        >
          <div className="w-4.5 h-4 object-contain ml-3">
            <img src={logos[chainId]} alt={''} className="w-4.5 h-full" />
          </div>
          <div
            className={`w-18 text-lg  ${
              active ? 'font-semibold' : 'font-medium'
            }`}
          >
            {networkMap[chainId]}
          </div>
          {currentChainId === chainId ? (
            <div className="mr-3 h-2 w-2 shadow-md rounded-2xl bg-green-400"></div>
          ) : (
            <div className="mr-3 h-2 w-2 rounded-2xl"></div>
          )}
        </div>
      )}
    </Menu.Item>
  );
};

export default NetworkOptionsMenuItem;
