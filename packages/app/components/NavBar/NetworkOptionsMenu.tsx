import { Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { ChainId } from "../../context/Web3/connectors";
import NetworkOptionsMenuItem from "./NetworkOptionsMenuItem";

interface NetworkOptionsMenuProps {
  currentChain: number;
  switchNetwork: (chainId: number) => void;
}

const NetworkOptionsMenu: React.FC<NetworkOptionsMenuProps> = ({ currentChain, switchNetwork, ...props }) => {
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
      <Menu.Items className="absolute top-14 w-48 -left-2 bg-white rounded-3xl shadow-md border-gray-200 border-solid border focus:outline-none ">
        <p className="text-center align-middle text-md font-light leading-none h-16 rounded-t-3xl border-b border-solid border-gray-200 pt-6 pb-3 ">
          Select a Network{" "}
        </p>

        <NetworkOptionsMenuItem
          chainId={ChainId.Ethereum}
          switchNetwork={(chainId) => switchNetwork(chainId)}
          currentChainId={currentChain}
          key={ChainId.Ethereum}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.Arbitrum}
          switchNetwork={(chainId) => switchNetwork(chainId)}
          currentChainId={currentChain}
          key={ChainId.Arbitrum}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.Polygon}
          switchNetwork={(chainId) => switchNetwork(chainId)}
          currentChainId={currentChain}
          key={ChainId.Polygon}
          last={true}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.BinanceSmartChain}
          switchNetwork={(chainId) => switchNetwork(chainId)}
          currentChainId={currentChain}
          key={ChainId.BinanceSmartChain}
        />
        {[ChainId.Hardhat, ChainId.Localhost, ChainId.Rinkeby].includes(parseInt(process.env.CHAIN_ID)) && [
          <NetworkOptionsMenuItem
            chainId={ChainId.Localhost}
            switchNetwork={(chainId) => switchNetwork(chainId)}
            currentChainId={currentChain}
            key={ChainId.Localhost}
          />,
          <NetworkOptionsMenuItem
            chainId={ChainId.Rinkeby}
            switchNetwork={(chainId) => switchNetwork(chainId)}
            currentChainId={currentChain}
            key={ChainId.Rinkeby}
          />,
        ]}
      </Menu.Items>
    </Transition>
  );
};

export default NetworkOptionsMenu;
