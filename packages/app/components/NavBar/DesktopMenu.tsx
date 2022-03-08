import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { setDualActionWideModal } from "context/actions";
import { FeatureToggleContext } from "context/FeatureToggleContext";
import { store } from "context/store";
import { connectors } from "context/Web3/connectors";
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
  const { chainId, account, activate, deactivate } = useWeb3();
  const router = useRouter();
  const switchNetwork = useNetworkSwitch();
  const { dispatch } = useContext(store);
  const { butter: butterEnabled } = useContext(FeatureToggleContext).features;

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
            <NavbarLink label="Butter" isActive={butterEnabled} onClick={showDelayInfo} />
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
        <button
          onClick={() => {
            if (account) {
              disconnectInjected(deactivate, activate, chainId);
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
  );
}
