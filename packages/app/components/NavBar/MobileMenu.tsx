import { Dialog, Transition } from "@headlessui/react";
import { ChainId, networkLogos, networkMap } from "@popcorn/utils";
import MainActionButton from "../MainActionButton";
import PopUpModal from "../Modal/PopUpModal";
import DiscordIcon from "../SVGIcons/DiscordIcon";
import MediumIcon from "../SVGIcons/MediumIcon";
import RedditIcon from "../SVGIcons/RedditIcon";
import TelegramIcon from "../SVGIcons/TelegramIcon";
import TwitterIcon from "../SVGIcons/TwitterIcon";
import YoutubeIcon from "../SVGIcons/YoutubeIcon";
import TertiaryActionButton from "../TertiaryActionButton";
import { FeatureToggleContext } from "@popcorn/app/context/FeatureToggleContext";
import { getProductLinks } from "@popcorn/app/helper/getProductLinks";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useContext, useEffect, useRef, useState } from "react";
import WheelPicker from "react-simple-wheel-picker";
import MobileProductsMenu from "./MobileProductsMenu";
import NavbarLink from "./NavbarLinks";
const networkData = [
  {
    id: JSON.stringify(ChainId.Ethereum),
    value: networkMap[ChainId.Ethereum],
  },
  {
    id: JSON.stringify(ChainId.Arbitrum),
    value: networkMap[ChainId.Arbitrum],
  },
  {
    id: JSON.stringify(ChainId.BNB),
    value: networkMap[ChainId.BNB],
  },
  {
    id: JSON.stringify(ChainId.Polygon),
    value: networkMap[ChainId.Polygon],
  },
];

export const MobileMenu: React.FC = () => {
  const { account, connect, disconnect, setChain, pushWithinChain } = useWeb3();
  const [menuVisible, toggleMenu] = useState<boolean>(false);
  const [productsMenuVisible, toggleProductsMenu] = useState<boolean>(false);
  const [availableNetworks, setAvailableNetworks] = useState(networkData);
  const router = useRouter();
  const products = getProductLinks(router, pushWithinChain);
  const [showPopUp, setShowPopUp] = useState<boolean>(false);

  const selectedNetwork = useRef(parseInt(networkData[0].id));

  const { showLocalNetwork } = useContext(FeatureToggleContext).features;

  useEffect(() => {
    toggleMenu(false);
  }, [router?.pathname]);

  useEffect(() => {
    if (showLocalNetwork && availableNetworks.length <= networkData.length) {
      setAvailableNetworks([
        ...availableNetworks,
        {
          id: JSON.stringify(ChainId.Rinkeby),
          value: networkMap[ChainId.Rinkeby],
        },
        {
          id: JSON.stringify(ChainId.Localhost),
          value: networkMap[ChainId.Localhost],
        },
      ]);
    }
  }, []);

  const handleOnChange = (newChainId) => {
    selectedNetwork.current = parseInt(newChainId.id);
  };

  const closePopUp = () => {
    setChain(selectedNetwork?.current);
    setShowPopUp(false);
  };

  return (
    <>
      <div className="flex flex-row justify-between items-center px-6 py-6 font-khTeka">
        <div>
          <Link href={`/${router?.query?.network}/`} passHref>
            <a>
              <img src="/images/icons/popLogo.svg" alt="Logo" className="w1010 h-10" />
            </a>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {!menuVisible && (
            <div className="relative w-full">
              <div
                className={`w-full px-4 py-2 flex flex-row items-center justify-center border border-light bg-white rounded-3xl cursor-pointer relative gap-2`}
                onClick={() => setShowPopUp(true)}
              >
                <img src={networkLogos[selectedNetwork.current]} alt={""} className="w-3 h-3 object-contain" />
                <span
                  className={`${account ? "border-green-400 bg-green-400" : "bg-white border-gray-300"
                    } block h-2 w-2 rounded-full border`}
                ></span>
              </div>
            </div>
          )}
          <button
            className="text-gray-500 w-10 relative focus:outline-none bg-white"
            onClick={() => toggleMenu(!menuVisible)}
          >
            <div className="block w-10">
              <span
                aria-hidden="true"
                className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${menuVisible ? "rotate-45 translate-y-1" : "-translate-y-2.5"
                  }`}
              ></span>
              <span
                aria-hidden="true"
                className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${menuVisible ? "opacity-0" : "opacity-100"
                  }`}
              ></span>
              <span
                aria-hidden="true"
                className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${menuVisible ? "-rotate-45 -translate-y-1" : "translate-y-2.5"
                  }`}
              ></span>
            </div>
          </button>
        </div>
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
                  <div className="h-full w-full flex flex-col justify-between pt-18 px-6 shadow-xl bg-white overflow-y-scroll">
                    <div className="flex flex-col w-full">
                      <div className="pt-6 pb-6">
                        <NavbarLink label="Popcorn" url="/" isActive={router.pathname === `/[network]`} />
                      </div>
                      <div className="py-6">
                        {products.length < 2 ? (
                          <NavbarLink label={products[0].title} isActive={false} onClick={() => products[0].onClick} />
                        ) : (
                          <NavbarLink label="Products" isActive={false} onClick={() => toggleProductsMenu(true)} />
                        )}
                      </div>
                      <div className="py-6">
                        <NavbarLink
                          label="Staking"
                          url="/staking"
                          isActive={router.pathname === "/[network]/staking"}
                        />
                      </div>
                      <div className="py-6">
                        <NavbarLink
                          label="Rewards"
                          url="/rewards"
                          isActive={router.pathname === "/[network]/rewards"}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="grid grid-cols-12 mt-12">
                        <div className="col-span-6">
                          <p className="text-gray-900 font-medium leading-6 tracking-1">Links</p>
                          <div className="flex flex-col">
                            <Link href="/">
                              <a href="" className=" text-primary leading-6 mt-4">
                                Popcorn
                              </a>
                            </Link>
                            <Link href="/docs/Popcorn_whitepaper_v1.pdf">
                              <a target="_blank" className=" text-primary leading-6 mt-4">
                                Whitepaper
                              </a>
                            </Link>
                          </div>
                        </div>

                        <div className="col-span-6">
                          <p className="text-gray-900 font-medium leading-6 tracking-1">Bug Bounty</p>
                          <div className="flex flex-col">
                            <Link href="/immunefi">
                              <a href="" className=" text-primary leading-6 mt-4">
                                Immunefi
                              </a>
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between pb-12 mt-11">
                        <a href="https://twitter.com/Popcorn_DAO">
                          <TwitterIcon color={"#645F4B"} size={"30"} />
                        </a>
                        <a href="https://discord.gg/w9zeRTSZsq">
                          <DiscordIcon color={"#645F4B"} size={"30"} />
                        </a>
                        <a href="https://t.me/popcorndaochat">
                          <TelegramIcon color={"#645F4B"} size={"30"} />
                        </a>
                        <a href="https://medium.com/popcorndao">
                          <MediumIcon color={"#645F4B"} size={"30"} />
                        </a>
                        <a href="https://www.reddit.com/r/popcorndao/">
                          <RedditIcon color={"#645F4B"} size={"30"} />
                        </a>
                        <a href="https://www.youtube.com/channel/UCe8n8mGG4JR7nhFT4v9APyA">
                          <YoutubeIcon color={"#645F4B"} size={"30"} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <PopUpModal visible={showPopUp} onClosePopUpModal={closePopUp}>
        <div>
          <p className=" text-black  mb-3">Connect to Wallet</p>
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
          <hr className="my-6" />
          <p className=" text-black mb-3">Select Network</p>
          <div className="wheelPicker">
            <WheelPicker
              data={availableNetworks}
              onChange={handleOnChange}
              height={200}
              titleText="Enter value same as aria-label"
              itemHeight={30}
              selectedID={JSON.stringify(selectedNetwork.current)}
              color="#e5e7eb"
              activeColor="#111827"
              backgroundColor="#fff"
            />
          </div>
        </div>
      </PopUpModal>
      <Transition.Root show={productsMenuVisible} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 overflow-hidden" onClose={() => toggleMenu(false)}>
          <div className="absolute inset-0 overflow-hidden">
            <Dialog.Overlay className="absolute inset-0" />

            <div className="fixed inset-x-0 bottom-0 max-w-full flex bg-white">
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
                  <MobileProductsMenu onCloseMenu={() => toggleProductsMenu(false)} />
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
