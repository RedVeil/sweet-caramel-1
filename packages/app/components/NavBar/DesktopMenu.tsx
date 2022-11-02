import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { ChainId, networkLogos } from "@popcorn/utils";
import { getProductLinks } from "@popcorn/app/helper/getProductLinks";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import MainActionButton from "@popcorn/app/components/MainActionButton";
import TertiaryActionButton from "@popcorn/app/components/TertiaryActionButton";
import useNetworkName from "@popcorn/app/hooks/useNetworkName";
import useSubscribeToNewsletter from "@popcorn/app/hooks/useSubscribeToNewsletter";
import Link from "next/link";
import { useRouter } from "next/router";
import DropDownComponent from "@popcorn/app/components/NavBar/DropDownComponent";
import GetPopMenu from "@popcorn/app/components/NavBar/GetPopMenu";
import NavbarLink from "@popcorn/app/components/NavBar/NavbarLinks";
import NetworkOptionsMenu from "@popcorn/app/components/NavBar/NetworkOptionsMenu";

export default function DesktopMenu(): JSX.Element {
  const { connectedChainId, account, connect, disconnect, pushWithinChain } = useWeb3();
  const { showNewsletterModal } = useSubscribeToNewsletter();
  const router = useRouter();
  const networkName = useNetworkName();

  return (
    <div className="flex flex-row items-center justify-between w-full p-8 z-30">
      <div className="flex flex-row items-center">
        <div>
          <Link href={`/`} passHref>
            <a>
              <img src="/images/icons/popLogo.svg" alt="Logo" className="w-10 h-10" />
            </a>
          </Link>
        </div>
      </div>
      <div className="flex flex-container flex-row w-fit-content gap-6 md:gap-0 md:space-x-6">
        <ul className="flex items-center flex-row gap-16 md:gap-0 md:space-x-16 mr-10">
          <li>
            <NavbarLink label="Popcorn" url="/" isActive={router.pathname === "/"} />
          </li>
          <li className="relative flex flex-container flex-row z-10">
            <Menu>
              <Menu.Button>
                <div className="group flex flex-row items-center -mr-2">
                  <p
                    className={` text-primary leading-5 text-lg 
										hover:text-black cursor-pointer`}
                  >
                    Products
                  </p>
                  <ChevronDownIcon
                    className="fill-current text-primary group-hover:text-black mb-0.5 w-5 h-5 ml-0.5"
                    aria-hidden="true"
                  />
                </div>
                <DropDownComponent options={getProductLinks(router, pushWithinChain)} />
              </Menu.Button>
            </Menu>
          </li>
          <li>
            <NavbarLink
              label="Rewards"
              url={`/${networkName}/rewards`}
              isActive={router.pathname === "/[network]/rewards"}
            />
          </li>
        </ul>
        <div className="relative flex flex-container flex-row z-10">
          <TertiaryActionButton
            label="Newsletter Sign Up"
            handleClick={showNewsletterModal}
            className="!border-customLightGray !font-normal hover:!bg-transparent hover:!text-primary"
          />
        </div>
        <div className="relative flex flex-container flex-row z-10">
          <Menu>
            <Menu.Button>
              <div className="w-36 cursor-pointer h-full py-3 px-5 flex flex-row items-center justify-between border border-customLightGray rounded-4xl text-primary">
                <img src="/images/icons/popLogo.svg" className="w-5 h-5" />
                <p className="ml-3 leading-none">POP</p>
                <ChevronDownIcon className="w-5 h-5 ml-4 text-primary" aria-hidden="true" />
              </div>
              <GetPopMenu />
            </Menu.Button>
          </Menu>
        </div>
        {account && (
          <div className="relative flex flex-container flex-row z-10">
            <Menu>
              <Menu.Button>
                <div
                  className={`h-full px-6 flex flex-row items-center justify-between border border-customLightGray rounded-4xl text-primary cursor-pointer`}
                >
                  <img src={networkLogos[connectedChainId]} alt={""} className="w-4.5 h-4 mr-4" />
                  <p className="leading-none mt-0.5">{ChainId[connectedChainId]}</p>
                  <ChevronDownIcon className="w-5 h-5 ml-4 text-primary" aria-hidden="true" />
                </div>
              </Menu.Button>
              <NetworkOptionsMenu />
            </Menu>
          </div>
        )}
        {!account ? (
          <MainActionButton
            label="Connect Wallet"
            handleClick={() => {
              connect();
            }}
          />
        ) : (
          <TertiaryActionButton label="Disconnect" handleClick={() => disconnect()} />
        )}
      </div>
    </div>
  );
}
