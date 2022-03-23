import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { setSingleActionModal } from "context/actions";
import { FeatureToggleContext } from "context/FeatureToggleContext";
import { store } from "context/store";
import { Wallets, walletToLogo } from "context/Web3/connectors";
import useNetworkSwitch from "hooks/useNetworkSwitch";
import useWeb3 from "hooks/useWeb3";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import GetPopMenu from "./GetPopMenu";
import { MenuProps } from "./MobileMenu";
import NavbarLink from "./NavbarLinks";
import NetworkOptionsMenu from "./NetworkOptionsMenu";

export default function DesktopMenu({ currentChain, disconnectInjected }: MenuProps): JSX.Element {
  const { chainId, account, activate, deactivate, showModal, selectedWallet } = useWeb3();
  const router = useRouter();
  const switchNetwork = useNetworkSwitch();
  const { dispatch } = useContext(store);
  const { butter: butterEnabled } = useContext(FeatureToggleContext).features;

  return (
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
            <NavbarLink label="Butter" url="/butter" isActive={router.pathname === "/butter"} />
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
        {selectedWallet !== Wallets.WALLETCONNECT ? (
          <div className="relative flex flex-container flex-row w-fit-content z-10">
            <Menu>
              <Menu.Button>
                <div
                  className={`w-44 mr-5 h-full px-6 flex flex-row items-center justify-between border border-gray-200 shadow-custom rounded-3xl cursor-pointer`}
                >
                  <img src={currentChain.logo} alt={""} className="w-4.5 h-4 mr-4" />
                  <p className="leading-none font-medium text-gray-600 mt-0.5">{currentChain.name}</p>
                  <ChevronDownIcon className="w-5 h-5 ml-4" aria-hidden="true" />
                </div>
              </Menu.Button>
              <NetworkOptionsMenu currentChain={chainId} switchNetwork={(newChainId) => switchNetwork(newChainId)} />
            </Menu>
          </div>
        ) : (
          <div
            className="relative flex flex-container flex-row w-fit-content z-10"
            onClick={() => {
              dispatch(
                setSingleActionModal({
                  title: "Network change on app",
                  content: "You must disconnect and change the wallet on your WalletConnect app",
                  onDismiss: {
                    label: "Dismiss",
                    onClick: () => {
                      dispatch(setSingleActionModal(false));
                    },
                  },
                }),
              );
            }}
          >
            <div
              className={`w-44 mr-5 h-full px-6 flex flex-row items-center justify-between border border-gray-200 shadow-custom rounded-3xl cursor-pointer`}
            >
              <img src={currentChain.logo} alt={""} className="w-4.5 h-4 mr-4" />
              <p className="leading-none font-medium text-gray-600 mt-0.5">{currentChain.name}</p>
              <ChevronDownIcon className="w-5 h-5 ml-4" aria-hidden="true" />
            </div>
          </div>
        )}
        <button
          onClick={showModal}
          className={`rounded-full flex flex-row justify-around items-center py-3 px-3 w-44 border border-transparent shadow-custom group hover:bg-blue-500 ${
            account ? "bg-blue-50 border-blue-700" : "bg-blue-100"
          }`}
        >
          <p className="text-blue-700 font-semibold text-base group-hover:text-white ">
            {account ? `${account.slice(0, 6)}...` : "Connect Wallet"}
          </p>
          {account && <img src={walletToLogo[selectedWallet]} className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
