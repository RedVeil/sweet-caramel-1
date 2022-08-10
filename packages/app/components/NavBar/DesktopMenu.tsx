import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { ChainId, networkLogos } from "@popcorn/utils";
import MainActionButton from "components/MainActionButton";
import TertiaryActionButton from "components/TertiaryActionButton";
import getProducts from "helper/products";
import useWeb3 from "hooks/useWeb3";
import Link from "next/link";
import { useRouter } from "next/router";
import DropDownComponent from "./DropDownComponent";
import GetPopMenu from "./GetPopMenu";
import NavbarLink from "./NavbarLinks";
import NetworkOptionsMenu from "./NetworkOptionsMenu";

export default function DesktopMenu(): JSX.Element {
  const { chainId, account, connect, disconnect, wallet, setChain, pushWithinChain } = useWeb3();
  const router = useRouter();
  const products = getProducts(router, pushWithinChain);

  return (
    <div className="flex flex-row items-center justify-between w-full p-8 z-30">
      <div className="flex flex-row items-center">
        <div>
          <Link href={`/${router?.query?.network}/`} passHref>
            <a>
              <img src="/images/icons/popLogo.svg" alt="Logo" className="w-10 h-10" />
            </a>
          </Link>
        </div>
      </div>
      <div className="flex flex-container flex-row w-fit-content gap-6">
        <ul className="flex items-center flex-row gap-16 mr-10">
          <li>
            <NavbarLink label="Popcorn" url="/" isActive={router.pathname === "/[network]"} />
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
                    className="fill-current text-primary group-hover:text-black mt-0.5 w-5 h-5 ml-0.5"
                    aria-hidden="true"
                  />
                </div>
                <DropDownComponent options={products} />
              </Menu.Button>
            </Menu>
          </li>
          <li>
            <NavbarLink label="Rewards" url="/rewards" isActive={router.pathname === "/[network]/rewards"} />
          </li>
        </ul>
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
        <div className="relative flex flex-container flex-row z-10">
          <Menu>
            <Menu.Button>
              <div
                className={`h-full px-6 flex flex-row items-center justify-between border border-customLightGray rounded-4xl text-primary cursor-pointer`}
              >
                <img src={networkLogos[chainId]} alt={""} className="w-4.5 h-4 mr-4" />
                <p className="leading-none mt-0.5">{ChainId[chainId]}</p>
                <ChevronDownIcon className="w-8 h-8 ml-4 text-primary" aria-hidden="true" />
              </div>
            </Menu.Button>
            <NetworkOptionsMenu currentChain={chainId} switchNetwork={(newChainId) => setChain(newChainId)} />
          </Menu>
        </div>
        {account ? (
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
