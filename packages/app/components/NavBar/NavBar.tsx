import { Web3Provider } from '@ethersproject/providers';
import { getChainLogo } from '@popcorn/utils';
import { useWeb3React } from '@web3-react/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { connectors, networkMap } from '../../context/Web3/connectors';
import NavbarLink from './NavbarLinks';

const Navbar: React.FC = () => {
  const { chainId, account, activate } = useWeb3React<Web3Provider>();
  const router = useRouter();
  const [showGrants, setShowGrants] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const [currentChainName, setCurrentChainName] = useState('trial');
  const [currentChainIcon, setCurrentChainIcon] = useState('');

  React.useEffect(() => {
    setCurrentChainName(networkMap[chainId]);
    let newChainLogo = getChainLogo(chainId);
    setCurrentChainIcon(newChainLogo);
  }, [chainId]);

  return (
    <nav className="flex pt-6 mx-20 bg-white">
      <div className="flex flex-row items-center justify-between w-10/12 pb-6 mx-auto">
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
        <div className="">
          <button
            onClick={() =>
              account ? deactivate() : activate(connectors.Injected)
            }
            className={`rounded-full py-3 w-44 group hover:bg-blue-500 ${
              account ? 'bg-blue-50 border border-blue-700' : 'bg-blue-100'
            }`}
          >
            <p className="text-blue-700 font-medium text-base group-hover:text-white">
              {account ? 'Disconnect Wallet' : 'Connect Wallet'}
            </p>
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
