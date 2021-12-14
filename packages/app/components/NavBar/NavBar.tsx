import { Web3Provider } from '@ethersproject/providers';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { useWeb3React } from '@web3-react/core';
import { store } from 'context/store';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useContext, useState } from 'react';
import { ChainId, connectors, networkMap } from '../../context/Web3/connectors';
import {
  getChainLogo,
  switchNetwork,
} from './../../context/Web3/networkSwitch';
import NavbarLink from './NavbarLinks';
import NetworkOptionsMenu from './NetworkOptionsMenu';

const disconnectInjectedAndActivateRPCConnector = (deactivate, activate) => {
  deactivate(connectors.Injected);
  activate(connectors.Network);
};

const Navbar: React.FC = () => {
  const { chainId, account, activate, deactivate } =
    useWeb3React<Web3Provider>();
  const router = useRouter();
  const [currentChainName, setCurrentChainName] = useState('trial');
  const [currentChainIcon, setCurrentChainIcon] = useState('');
  const { dispatch } = useContext(store);

  React.useEffect(() => {
    setCurrentChainName(networkMap[chainId]);
    setCurrentChainIcon(getChainLogo(chainId));
  }, [chainId]);

  return (
    <nav className="flex pt-9 bg-white z-20">
      <div className="flex flex-row items-center justify-between lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl pb-6 mx-auto">
        <div className="flex flex-row items-center">
          <div>
            <Link href="/" passHref>
              <a>
                <img
                  src="/images/icons/popLogo.png"
                  alt="Logo"
                  className="w-10 h-10"
                />
              </a>
            </Link>
          </div>
          <ul className="flex flex-row space-x-10 ml-16">
            <li>
              <NavbarLink
                label="Yield Optimizer"
                url="/butter"
                isActive={router.pathname === '/butter'}
              />
            </li>
            <li>
              <NavbarLink
                label="Staking"
                url="/staking"
                isActive={router.pathname === '/staking'}
              />
            </li>
            <li>
              <NavbarLink
                label="Claims"
                url="/rewards"
                isActive={router.pathname === '/rewards'}
              />
            </li>
          </ul>
        </div>
        <div className="flex flex-container flex-row w-fit-content">
          <a
            onClick={async () =>
              await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                  type: 'ERC20',
                  options: {
                    address: getPopAddress(chainId),
                    symbol: 'POP',
                    decimals: 18,
                    image: 'https://popcorn.network/images/icons/pop_64x64.png',
                  },
                },
              })
            }
            className="cursor-pointer h-full p-3 pflex flex-row items-center justify-between border border-gray-200 shadow-custom rounded-3xl mr-5"
          >
            <img src="/images/icons/popLogo.png" className="w-5 h-5" />
          </a>
          <div className="relative flex flex-container flex-row w-fit-content z-10">
            <Menu>
              <Menu.Button>
                <div
                  className={`w-44 mr-5 h-full px-6 flex flex-row items-center justify-between border border-gray-200 shadow-custom rounded-3xl ${
                    account ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <img
                    src={currentChainIcon}
                    alt={''}
                    className="w-4.5 h-4 mr-4"
                  />
                  <p className="leading-none font-medium text-gray-600 mt-0.5">
                    {currentChainName}
                  </p>
                  {account ? (
                    <ChevronDownIcon
                      className="w-5 h-5 ml-4"
                      aria-hidden="true"
                    />
                  ) : (
                    <div></div>
                  )}
                </div>
              </Menu.Button>
              {account && (
                <NetworkOptionsMenu
                  currentChain={chainId}
                  switchNetwork={(chainId) => {
                    switchNetwork(chainId, dispatch);
                  }}
                />
              )}
            </Menu>
          </div>
          <button
            onClick={() =>
              account
                ? disconnectInjectedAndActivateRPCConnector(
                    deactivate,
                    activate,
                  )
                : activate(connectors.Injected)
            }
            className={`rounded-full py-3 w-44 border border-transparent shadow-custom group hover:bg-blue-500 ${
              account ? 'bg-blue-50 border-blue-700' : 'bg-blue-100'
            }`}
          >
            <p className="text-blue-700 font-semibold text-base group-hover:text-white ">
              {account ? 'Disconnect Wallet' : 'Connect Wallet'}
            </p>
          </button>
        </div>
      </div>
    </nav>
  );
};

const getPopAddress = (chainid) => {
  switch (chainid) {
    case ChainId.Polygon:
      return '0xC5B57e9a1E7914FDA753A88f24E5703e617Ee50c';
    case ChainId.Arbitrum:
      return '0x68ead55c258d6fa5e46d67fc90f53211eab885be';
    case ChainId.Ethereum:
      return '0xd0cd466b34a24fcb2f87676278af2005ca8a78c4';
    default:
      return '0xd0cd466b34a24fcb2f87676278af2005ca8a78c4';
  }
};
export default Navbar;
