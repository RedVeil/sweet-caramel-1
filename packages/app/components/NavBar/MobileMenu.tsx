import { Dialog, Transition } from "@headlessui/react";
import { ChainId, networkLogos, networkMap } from "@popcorn/utils";
import MainActionButton from "components/MainActionButton";
import PopUpModal from "components/Modal/PopUpModal";
import DiscordIcon from "components/SVGIcons/DiscordIcon";
import FacebookIcon from "components/SVGIcons/FacebookIcon";
import GithubIcon from "components/SVGIcons/GithubIcon";
import TwitterIcon from "components/SVGIcons/TwitterIcon";
import GetProducts from "helper/products";
import useWeb3 from "hooks/useWeb3";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useEffect, useRef, useState } from "react";
import WheelPicker from "react-simple-wheel-picker";
import MobileProductsMenu from "./MobileProductsMenu";
import NavbarLink from "./NavbarLinks";

export const MobileMenu: React.FC = () => {
  const { chainId, account, connect, disconnect, wallet, setChain, pushWithinChain, contractAddresses } = useWeb3();
  const [menuVisible, toggleMenu] = useState<boolean>(false);
  const [productsMenuVisible, toggleProductsMenu] = useState<boolean>(false);
  const router = useRouter();
  const products = GetProducts(router, pushWithinChain);
  const [showPopUp, setShowPopUp] = useState<boolean>(false);

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
      id: JSON.stringify(ChainId.Rinkeby),
      value: networkMap[ChainId.Rinkeby],
    },
    {
      id: JSON.stringify(ChainId.Localhost),
      value: networkMap[ChainId.Localhost],
    },
    {
      id: JSON.stringify(ChainId.Polygon),
      value: networkMap[ChainId.Polygon],
    },
  ];

  const selectedNetwork = useRef(parseInt(networkData[2].id));

  useEffect(() => {
    toggleMenu(false);
  }, [router?.pathname]);

  const handleOnChange = (newChainId) => {
    selectedNetwork.current = parseInt(newChainId.id);
  };

  const closePopUp = () => {
    setChain(selectedNetwork?.current);
    setShowPopUp(false);
  };

  return (
    <>
      <div className="flex flex-row justify-between items-center px-6 py-6 border-b border-gray-100 font-khTeka">
        <div>
          <Link href={`/${router?.query?.network}/`} passHref>
            <a>
              <img src="/images/icons/popLogo.svg" alt="Logo" className="w-12 h-12" />
            </a>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full">
            <div
              className={`w-full px-5 py-2 flex flex-row items-center justify-center border border-light bg-white rounded-3xl cursor-pointer relative gap-2`}
              onClick={() => setShowPopUp(true)}
            >
              <img src={networkLogos[selectedNetwork.current]} alt={""} className="w-6 h-6 object-contain" />
              <span
                className={`${
                  account ? "border-green-400 bg-green-400" : "bg-white border-gray-300"
                } block h-2 w-2 rounded-full border`}
              ></span>
            </div>
          </div>
          <button
            className="text-gray-500 w-8 relative focus:outline-none bg-white"
            onClick={() => toggleMenu(!menuVisible)}
          >
            <div className="block w-8">
              <span
                aria-hidden="true"
                className={`block absolute h-1 w-8 bg-black transform transition duration-500 ease-in-out ${
                  menuVisible ? "rotate-45" : "-translate-y-1.5"
                }`}
              ></span>
              <span className={`block h-0.5 ${menuVisible ? "hidden" : "block"}`}></span>
              <span
                aria-hidden="true"
                className={`block absolute h-1 w-8 bg-black transform transition duration-500 ease-in-out ${
                  menuVisible ? "opacity-0" : "opacity-100"
                }`}
              ></span>
              <span className={`block h-0.5 ${menuVisible ? "hidden" : "block"}`}></span>
              <span
                aria-hidden="true"
                className={`block absolute h-1 w-8 bg-black transform transition duration-500 ease-in-out ${
                  menuVisible ? "-rotate-45" : "translate-y-1.5"
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
                  <div className="h-full w-full flex flex-col justify-between pt-1 px-8 shadow-xl bg-white overflow-y-scroll">
                    <div className="flex flex-col w-full">
                      <div className="pt-6 pb-6">
                        <NavbarLink label="Popcorn" url="/" isActive={router.pathname === `/[network]`} />
                      </div>
                      <div className="relative flex flex-container flex-row z-10 py-6">
                        {products.length < 2 ? (
                          <li className="mt-1">
                            <NavbarLink
                              label={products[0].title}
                              isActive={false}
                              onClick={() => products[0].onClick}
                            />
                          </li>
                        ) : (
                          <div
                            className="group flex flex-row items-center -mr-2"
                            onClick={() => toggleProductsMenu(true)}
                          >
                            <p
                              className={`text-primary leading-5 text-5xl
														hover:text-black cursor-pointer cursor-pointer`}
                            >
                              Products
                            </p>
                          </div>
                        )}
                      </div>
                      {/* <div className="py-6">
												<NavbarLink
													label="Staking"
													url="/staking"
													isActive={router.pathname === "/[network]/staking"}
												/>
											</div> */}
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
                        <a href="https://www.facebook.com/PopcornDAO">
                          <FacebookIcon color={"#111827"} size={"50"} />
                        </a>
                        <a href="https://twitter.com/Popcorn_DAO">
                          <TwitterIcon color={"#111827"} size={"50"} />
                        </a>
                        <a href="https://github.com/popcorndao">
                          <GithubIcon color={"#111827"} size={"50"} />
                        </a>
                        <a href="https://discord.gg/w9zeRTSZsq">
                          <DiscordIcon color={"#111827"} size={"50"} />
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
          <MainActionButton
            label={account ? `Disconnect` : "Connect Wallet"}
            handleClick={() => {
              if (account) {
                disconnect();
              } else {
                connect();
              }
            }}
          />
          {/* <button
						onClick={() => {
							if (account) {
								disconnect();
							} else {
								connect();
							}
						}}
						className={`rounded-full py-3 w-full flex flex-row justify-center gap-2 items-center px-3 border border-transparent shadow-custom group hover:bg-blue-500 ${account ? "bg-blue-50 border-blue-700" : "bg-blue-100"
							}`}
					>
						<p className="text-blue-700 font-semibold text-base group-hover:text-white ">
							{account ? `Disconnect` : "Connect Wallet"}
						</p>
						{account && <img className="w-6 h-6" src={`data:image/svg+xml;utf8,${encodeURIComponent(wallet?.icon)}`} />}
					</button> */}
          <hr className="my-6" />
          <p className=" text-black mb-3">Select Network</p>
          <div className="wheelPicker">
            <WheelPicker
              data={networkData}
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
