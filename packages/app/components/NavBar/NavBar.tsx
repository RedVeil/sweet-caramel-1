import { Web3Provider } from "@ethersproject/providers";
import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { useWeb3React } from "@web3-react/core";
import { setDualActionWideModal } from "context/actions";
import { store } from "context/store";
import activateRPCNetwork from "helper/activateRPCNetwork";
import useEagerConnect from "hooks/useEagerConnect";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FC, useContext, useEffect, useState } from "react";
import { connectors, networkMap } from "../../context/Web3/connectors";
import { getChainLogo, switchNetwork } from "./../../context/Web3/networkSwitch";
import GetPopMenu from "./GetPopMenu";
import NavbarLink from "./NavbarLinks";
import NetworkOptionsMenu from "./NetworkOptionsMenu";

const disconnectInjectedAndActivateRPCConnector = (deactivate, activate) => {
  localStorage.setItem("eager_connect", "false");
  deactivate(connectors.Injected);
  activateRPCNetwork(activate);
};

const Navbar: FC = () => {
  const { chainId, account, activate, deactivate } = useWeb3React<Web3Provider>();
  const router = useRouter();
  const [currentChainName, setCurrentChainName] = useState(networkMap[chainId]);
  const [currentChainIcon, setCurrentChainIcon] = useState(getChainLogo(chainId));
  useEagerConnect();
  useEffect(() => {
    setCurrentChainName(networkMap[chainId]);
    setCurrentChainIcon(getChainLogo(chainId));
  }, [chainId]);
  const { dispatch } = useContext(store);

  function showDelayInfo() {
    dispatch(
      setDualActionWideModal({
        title: "Coming Soon",
        content:
          "The release of our yield optimizer, Butter, has been delayed due to recent events involving Abracadabra and MIM. We've decided to change Butter's underlying assets to address these concerns and offer the best product possible in today's DeFi landscape.",
        image: <img src="/images/ComingSoonCat.svg" className="mx-auto pl-5 w-6/12" />,
        onConfirm: {
          label: "Learn More",
          onClick: () => {
            window.open(
              "https://www.notion.so/popcorn-network/Where-s-Butter-edb3b58f6e6541ea9b10242d0fe2df9c",
              "_blank",
            );
            dispatch(setDualActionWideModal(false));
          },
        },
        onDismiss: {
          label: "Dismiss",
          onClick: () => {
            dispatch(setDualActionWideModal(false));
          },
        },
      }),
    );
  }

  return (
    <nav className="flex pt-9 bg-white z-10">
      <div className="flex flex-row items-center justify-between lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl pb-6 mx-auto z-50">
        <div className="flex flex-row items-center">
          <div>
            <Link href="/" passHref>
              <a>
                <img src="/images/icons/popLogo.png" alt="Logo" className="w-10 h-10" />
              </a>
            </Link>
          </div>
          <ul className="flex flex-row space-x-10 ml-16">
            <li>
              <NavbarLink label="Butter" isActive={false} onClick={showDelayInfo} />
            </li>
            <li>
              <NavbarLink label="Staking" url="/staking" isActive={router.pathname === "/staking"} />
            </li>
            <li>
              <NavbarLink label="Rewards" url="/rewards" isActive={router.pathname === "/rewards"} />
            </li>
          </ul>
        </div>
        <div className="flex flex-container flex-row w-fit-content">
          <div className="relative flex flex-container flex-row w-fit-content z-10">
            <Menu>
              <Menu.Button>
                <div className="w-36 cursor-pointer h-full py-3 px-5 flex flex-row items-center justify-between border border-gray-200 shadow-custom rounded-3xl mr-5">
                  <img src="/images/icons/popLogo.png" className="w-5 h-5" />
                  <p className="font-medium ml-3 leading-none mt-1">POP</p>
                  <ChevronDownIcon className="w-5 h-5 ml-4" aria-hidden="true" />
                </div>
                <GetPopMenu chainId={chainId} />
              </Menu.Button>
            </Menu>
          </div>
          <div className="relative flex flex-container flex-row w-fit-content z-10">
            <Menu>
              <Menu.Button>
                <div
                  className={`w-44 mr-5 h-full px-6 flex flex-row items-center justify-between border border-gray-200 shadow-custom rounded-3xl ${
                    account ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <img src={currentChainIcon} alt={""} className="w-4.5 h-4 mr-4" />
                  <p className="leading-none font-medium text-gray-600 mt-0.5">{currentChainName}</p>
                  {account ? <ChevronDownIcon className="w-5 h-5 ml-4" aria-hidden="true" /> : <div></div>}
                </div>
              </Menu.Button>
              {account && (
                <NetworkOptionsMenu
                  currentChain={chainId}
                  switchNetwork={(chainId) => {
                    switchNetwork(chainId);
                  }}
                />
              )}
            </Menu>
          </div>
          <button
            onClick={() => {
              if (account) {
                disconnectInjectedAndActivateRPCConnector(deactivate, activate);
              } else {
                localStorage.setItem("eager_connect", "true");
                activate(connectors.Injected);
              }
            }}
            className={`rounded-full py-3 w-44 border border-transparent shadow-custom group hover:bg-blue-500 ${
              account ? "bg-blue-50 border-blue-700" : "bg-blue-100"
            }`}
          >
            <p className="text-blue-700 font-semibold text-base group-hover:text-white ">
              {account ? "Disconnect Wallet" : "Connect Wallet"}
            </p>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
