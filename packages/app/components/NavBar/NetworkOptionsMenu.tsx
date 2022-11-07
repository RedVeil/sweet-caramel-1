import { Menu, Transition } from "@headlessui/react";
import { ChainId } from "@popcorn/utils";
import { FeatureToggleContext } from "@popcorn/app/context/FeatureToggleContext";
import React, { Fragment, useContext } from "react";
import NetworkOptionsMenuItem from "@popcorn/app/components/NavBar/NetworkOptionsMenuItem";
import useWeb3 from "@popcorn/app/hooks/useWeb3";

function NetworkOptionsMenu(): JSX.Element {
  const { connectedChainId, setChain } = useWeb3();
  const { showLocalNetwork } = useContext(FeatureToggleContext).features;
  return (
    <Transition
      appear={true}
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="hidden transform opacity-0 scale-95"
      enterTo="block transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="block transform opacity-100 scale-100"
      leaveTo="hidden transform opacity-0 scale-95"
    >
      <Menu.Items className="md:absolute w-full mt-2 md:top-14 md:w-48 md:-left-2 bg-white rounded-3xl shadow-md border-gray-200 border-solid border focus:outline-none">
        <p className="text-center align-middle text-lg leading-none h-16 rounded-t-3xl border-b border-solid border-gray-200 pt-6 pb-3 text-primary">
          Select a Network{" "}
        </p>
        <NetworkOptionsMenuItem
          chainId={ChainId.Ethereum}
          switchNetwork={(chainId) => setChain(chainId)}
          currentChainId={connectedChainId}
          key={ChainId.Ethereum}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.Arbitrum}
          switchNetwork={(chainId) => setChain(chainId)}
          currentChainId={connectedChainId}
          key={ChainId.Arbitrum}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.BNB}
          switchNetwork={(chainId) => setChain(chainId)}
          currentChainId={connectedChainId}
          key={ChainId.BNB}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.Optimism}
          switchNetwork={(chainId) => setChain(chainId)}
          currentChainId={connectedChainId}
          key={ChainId.Optimism}
        />
        {showLocalNetwork && (
          <>
            <NetworkOptionsMenuItem
              chainId={ChainId.Hardhat}
              switchNetwork={(chainId) => setChain(chainId)}
              currentChainId={connectedChainId}
              key={ChainId.Hardhat}
            />
            <NetworkOptionsMenuItem
              chainId={ChainId.Rinkeby}
              switchNetwork={(chainId) => setChain(chainId)}
              currentChainId={connectedChainId}
              key={ChainId.Rinkeby}
            />
            <NetworkOptionsMenuItem
              chainId={ChainId.RemoteFork}
              switchNetwork={(chainId) => setChain(chainId)}
              currentChainId={connectedChainId}
              key={ChainId.RemoteFork}
            />
          </>
        )}
        <NetworkOptionsMenuItem // this should be last otherwise the UI looks messed up. see last prop below:
          chainId={ChainId.Polygon}
          switchNetwork={(chainId) => setChain(chainId)}
          currentChainId={connectedChainId}
          key={ChainId.Polygon}
          last={true}
        />
      </Menu.Items>
    </Transition>
  );
}

export default NetworkOptionsMenu;
