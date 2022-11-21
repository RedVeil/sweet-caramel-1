import { Menu, Transition } from "@headlessui/react";
import { ChainId } from "@popcorn/utils";
import React, { Fragment } from "react";
import NetworkOptionsMenuItem from "@popcorn/app/components/NavBar/NetworkOptionsMenuItem";
import { useNetwork } from "wagmi";
import { switchNetwork } from "@wagmi/core";
import { useFeatures } from "@popcorn/app/hooks/useFeatures";

function NetworkOptionsMenu(): JSX.Element {
  const { chain } = useNetwork();
  const {
    features: { showLocalNetwork },
  } = useFeatures();
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
          switchNetwork={(chainId) => switchNetwork({ chainId })}
          currentChainId={chain?.id}
          key={ChainId.Ethereum}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.Arbitrum}
          switchNetwork={(chainId) => switchNetwork({ chainId })}
          currentChainId={chain?.id}
          key={ChainId.Arbitrum}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.BNB}
          switchNetwork={(chainId) => switchNetwork({ chainId })}
          currentChainId={chain?.id}
          key={ChainId.BNB}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.Optimism}
          switchNetwork={(chainId) => switchNetwork({ chainId })}
          currentChainId={chain?.id}
          key={ChainId.Optimism}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.Hardhat}
          switchNetwork={(chainId) => switchNetwork({ chainId })}
          currentChainId={chain?.id}
          key={ChainId.Hardhat}
          hidden={!showLocalNetwork}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.Rinkeby}
          switchNetwork={(chainId) => switchNetwork({ chainId })}
          currentChainId={chain?.id}
          key={ChainId.Rinkeby}
          hidden={!showLocalNetwork}
        />
        <NetworkOptionsMenuItem
          chainId={ChainId.RemoteFork}
          switchNetwork={(chainId) => switchNetwork({ chainId })}
          currentChainId={chain?.id}
          key={ChainId.RemoteFork}
          hidden={!showLocalNetwork}
        />
        <NetworkOptionsMenuItem // this should be last otherwise the UI looks messed up. see last prop below:
          chainId={ChainId.Polygon}
          switchNetwork={(chainId) => switchNetwork({ chainId })}
          currentChainId={chain?.id}
          key={ChainId.Polygon}
          last={true}
        />
      </Menu.Items>
    </Transition>
  );
}

export default NetworkOptionsMenu;
