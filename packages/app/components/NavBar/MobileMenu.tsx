import { Dialog, Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import SecondaryActionButton from "components/SecondaryActionButton";
import { connectors } from "context/Web3/connectors";
import useNetworkSwitch from "hooks/useNetworkSwitch";
import useWeb3 from "hooks/useWeb3";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { getPoolLink, getPopAddress } from "./GetPopMenu";
import NavbarLink from "./NavbarLinks";
import NetworkOptionsMenu from "./NetworkOptionsMenu";

export interface MenuProps {
  currentChain: { name: string; logo: any };
  disconnectInjected: (deactivate: Function, activate: any, chainId: number) => void;
}

export const MobileMenu: React.FC<MenuProps> = ({ currentChain, disconnectInjected }) => {
  const { chainId, account, activate, deactivate } = useWeb3();
  const [menuVisible, toggleMenu] = useState<boolean>(false);
  const switchNetwork = useNetworkSwitch();
  const router = useRouter();

  return (
    <>
      <div className="flex flex-row justify-between items-center px-8 py-6 border-b border-gray-400">
        <div>
          <Link href="/" passHref>
            <a>
              <img src="/images/icons/popLogo.png" alt="Logo" className="w-8 h-8" />
            </a>
          </Link>
        </div>
        <button
          className="text-gray-500 w-5 h-5 relative focus:outline-none bg-white"
          onClick={() => toggleMenu(!menuVisible)}
        >
          <div className="block w-5 absolute">
            <span
              aria-hidden="true"
              className={`block absolute h-0.5 w-5 bg-current transform transition duration-500 ease-in-out ${
                menuVisible ? "rotate-45" : "-translate-y-1.5"
              }`}
            ></span>
            <span
              aria-hidden="true"
              className={`block absolute h-0.5 w-5 bg-current transform transition duration-500 ease-in-out ${
                menuVisible ? "opacity-0" : "opacity-100"
              }`}
            ></span>
            <span
              aria-hidden="true"
              className={`block absolute h-0.5 w-5 bg-current transform transition duration-500 ease-in-out ${
                menuVisible ? "-rotate-45" : "translate-y-1.5"
              }`}
            ></span>
          </div>
        </button>
      </div>
      <Transition.Root show={menuVisible} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 overflow-hidden" onClose={() => toggleMenu(false)}>
          <div className="absolute inset-0 overflow-hidden">
            <Dialog.Overlay className="absolute inset-0" />

            <div className="fixed inset-x-0 top-20 bottom-0 max-w-full flex bg-white">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <div className="w-screen">
                  <div className="h-full w-full flex flex-col pt-1 px-8 shadow-xl bg-white overflow-y-scroll">
                    <div className="flex flex-col divide-y divide-gray-200 w-full">
                      <div className="pt-6 pb-6">
                        <NavbarLink label="Home" url="/" isActive={router.pathname === "/"} />
                      </div>
                      <div className="py-6">
                        <NavbarLink label="Staking" url="/staking" isActive={router.pathname === "/staking"} />
                      </div>
                      <div className="py-6">
                        <NavbarLink label="Rewards" url="/rewards" isActive={router.pathname === "/rewards"} />
                      </div>
                      <div className="py-10 space-y-6">
                        <SecondaryActionButton
                          label="Buy POP"
                          handleClick={() => window.open(getPoolLink(chainId), "_blank")}
                        />
                        <SecondaryActionButton
                          label="Add POP to Wallet"
                          handleClick={async () =>
                            await window.ethereum.request({
                              method: "wallet_watchAsset",
                              params: {
                                type: "ERC20",
                                options: {
                                  address: getPopAddress(chainId),
                                  symbol: "POP",
                                  decimals: 18,
                                  image: "https://popcorn.network/images/icons/pop_64x64.png",
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="relative py-10 w-full h-full">
                        <p className="font-medium leading-4 text-gray-500 mb-2">Network Switcher</p>
                        <Menu as={Fragment}>
                          <Menu.Button as={Fragment}>
                            <div
                              className={`w-full px-6 h-12 py-0.5 flex flex-row items-center justify-between border border-gray-200 shadow-custom rounded-3xl cursor-pointer`}
                            >
                              <img src={currentChain.logo} alt={""} className="w-4.5 h-4 mr-4" />
                              <p className="leading-none font-medium text-gray-600 mt-0.5">{currentChain.name}</p>
                              <ChevronDownIcon className="w-5 h-5 ml-4" aria-hidden="true" />
                            </div>
                          </Menu.Button>
                          <NetworkOptionsMenu
                            currentChain={chainId}
                            switchNetwork={(newChainId) => switchNetwork(newChainId)}
                          />
                        </Menu>
                      </div>
                      <div className="py-10">
                        <button
                          onClick={() => {
                            if (account) {
                              disconnectInjected(deactivate, activate, chainId);
                            } else {
                              localStorage.setItem("eager_connect", "true");
                              activate(connectors.Injected);
                            }
                          }}
                          className={`rounded-full py-3 w-full border border-transparent shadow-custom group hover:bg-blue-500 ${
                            account ? "bg-blue-50 border-blue-700" : "bg-blue-100"
                          }`}
                        >
                          <p className="text-blue-700 font-semibold text-base group-hover:text-white ">
                            {account ? "Disconnect Wallet" : "Connect Wallet"}
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
