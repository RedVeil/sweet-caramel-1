import { Web3Provider } from '@ethersproject/providers';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { switchNetwork, getChainLogo } from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import useEagerConnect from 'hooks/useEagerConnect';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { connectors, networkMap } from '../../context/Web3/connectors';
import NavbarLink from './NavbarLinks';
import NetworkOptionsMenu from './NetworkOptionsMenu';


const Navbar: React.FC = () => {
  const { chainId, account, activate } = useWeb3React<Web3Provider>();
  const router = useRouter();
  const [showGrants, setShowGrants] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const [currentChainName, setCurrentChainName] = useState('trial');
  const [currentChainIcon, setCurrentChainIcon] = useState('');
  const triedEagerConnect = useEagerConnect();

  React.useEffect(() => {
    setCurrentChainName(networkMap[chainId]);
    let newChainLogo = getChainLogo(chainId);
    setCurrentChainIcon(newChainLogo)
  }, [chainId]);

  return (
    <>
      <nav className="flex shadow-md py-3 px-14 bg-white">
        <div>
          <Link href="/" passHref>
            <a>
              <img
                src="/images/icons/popLogo.png"
                alt="Logo"
                className="w-8 h-8"
              />
            </a>
          </Link>
        </div>
        <ul className="flex flex-row items-center mx-auto space-x-16">
          <li />
          <li>
            <NavbarLink
              label="Staking"
              url="/staking"
              isActive={router.pathname === '/staking'}
            />
          </li>
          <li>
            <NavbarLink
              label="Rewards"
              url="/rewards"
              isActive={router.pathname === '/rewards'}
            />
          </li>
          <li>
            <NavbarLink
              label="White Paper"
              url="/docs/Popcorn_whitepaper_v1.pdf"
              isActive={false}
              target="_window"
            />
          </li>
        </ul>
        <div className="flex flex-container flex-row w-fit-content">
          <Menu>
            <Menu.Button>
              <div className="w-44 h-full px-6 flex flex-row items-center justify-between border border-gray-200 shadow-sm rounded-3xl">
                <img src={currentChainIcon} alt={""} className='w-4.5 h-4 mr-4' />
                <p>{currentChainName}</p>
                <ChevronDownIcon className="w-5 h-5 ml-4 pt-0.5" aria-hidden="true" />
              </div>
            </Menu.Button>
            <NetworkOptionsMenu
              currentChain={chainId}
              switchNetwork={switchNetwork}
            />
          </Menu>

          <button
            className="ml-10 w-28 p-1 flex flex-row items-center justify-center border border-gray-400 rounded hover:bg-indigo-400 hover:text-white"
            onClick={() => {
              activate(connectors.Injected);
              localStorage.setItem('eager_connect', 'true');
            }}
          >
            <p>Connect{account && 'ed'}</p>
            {account && (
              <div className="w-2 h-2 bg-green-400 rounded-full ml-2" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
export default Navbar;
