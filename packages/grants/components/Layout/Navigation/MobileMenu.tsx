import { Web3Provider } from "@ethersproject/providers";
import { Dialog, Transition } from "@headlessui/react";
import { ChevronLeftIcon, DocumentAddIcon } from "@heroicons/react/outline";
import { useWeb3React } from "@web3-react/core";
import Button from "components/CommonComponents/Button";
import PopUpModal from "components/Modal/PopUpModal";
import { DiscordIcon, MediumIcon, RedditIcon, TelegramIcon, TwitterIcon, YoutubeIcon } from "components/Svgs";
import { connectors } from "context/Web3/connector";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useEffect, useState } from "react";
import NavbarLink from "./NavbarLink";

export const MobileMenu: React.FC = () => {
  const router = useRouter();
  const [menuVisible, toggleMenu] = useState<boolean>(false);
  const [showVoteMenu, setShowVoteMenu] = useState<boolean>(false);
  const [showPopUp, setSowPopup] = useState<boolean>(false);
  const context = useWeb3React<Web3Provider>();
  const { account, activate, deactivate } = context;

  useEffect(() => {
    toggleMenu(false);
  }, [router?.pathname]);

  const handleConnectWallet = async () => {
    try {
      await activate(connectors.Injected);
      setSowPopup(false);
    } catch (ex) {
      console.log(ex);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      deactivate();
      setSowPopup(false);
    } catch (ex) {
      console.log(ex);
    }
  };

  return (
    <>
      <div className="flex flex-row justify-between items-center h-full">
        <div>
          <Link href="/" passHref>
            <img src="/images/popLogo.svg" alt="Logo" className="w-10 h-10" />
          </Link>
        </div>
        {!menuVisible && (
          <>
            <button
              className="bg-transparent border-[#C8C8C8] text-primary rounded-4xl text-base flex flex-row items-center justify-center font-medium px-5 py-1.5 border transition-all ease-in-out duration-500"
              onClick={() => setSowPopup(true)}
            >
              <div className="w-4 h-4 relative mr-2">
                <Image
                  src="/images/polygonLogo.png"
                  alt="polygon logo"
                  layout="fill"
                  objectFit="contain"
                  priority={true}
                />
              </div>
              <span
                className={`${
                  account ? "border-green-400 bg-green-400" : "bg-white border-gray-300"
                } block h-2 w-2 rounded-full border`}
              ></span>
            </button>
            <Link href="/apply" passHref legacyBehavior>
              <button className="bg-transparent border-primary text-primary rounded-4xl text-base flex flex-row items-center justify-center font-medium px-5 py-1.5 border transition-all ease-in-out duration-500">
                <DocumentAddIcon className="text-primary w-5 h-4" />
              </button>
            </Link>
          </>
        )}
        <button
          className="text-gray-500 w-10 relative focus:outline-none bg-white"
          onClick={() => toggleMenu(!menuVisible)}
        >
          <div className="block w-10">
            <span
              aria-hidden="true"
              className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${
                menuVisible ? "rotate-45 translate-y-1" : "-translate-y-2.5"
              }`}
            ></span>
            <span
              aria-hidden="true"
              className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${
                menuVisible ? "opacity-0" : "opacity-100"
              }`}
            ></span>
            <span
              aria-hidden="true"
              className={`block h-1 w-10 bg-black transform transition duration-500 ease-in-out rounded-3xl ${
                menuVisible ? "-rotate-45 -translate-y-1" : "translate-y-2.5"
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
                  <div className="h-full w-full flex flex-col justify-between pt-18 px-6 shadow-xl bg-white overflow-y-scroll">
                    <div className="flex flex-col w-full">
                      <div className="py-6">
                        <NavbarLink label="Vote Now" isActive={false} onClick={() => setShowVoteMenu(true)} />
                      </div>
                      <div className="py-6">
                        <NavbarLink
                          label="Eligible Beneficiaries"
                          url="/beneficiaries"
                          isActive={router.pathname === "/beneficiaries"}
                        />
                      </div>
                      <div className="py-6">
                        <Button variant="secondary" className="w-full" onClick={() => router.push("/apply")}>
                          Create Proposal
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="grid grid-cols-12 mt-12">
                        <div className="col-span-6">
                          <p className="text-gray-900 font-medium leading-[140%] tracking-1">Links</p>
                          <div className="flex flex-col">
                            <Link href="/" className=" text-primary leading-6 mt-4">
                              Popcorn
                            </Link>
                            <Link
                              href="/docs/Popcorn_whitepaper_v1.pdf"
                              target="_blank"
                              className=" text-primary leading-6 mt-4"
                            >
                              Whitepaper
                            </Link>
                          </div>
                        </div>

                        <div className="col-span-6">
                          <p className="text-gray-900 font-medium leading-[140%] tracking-1">Bug Bounty</p>
                          <div className="flex flex-col">
                            <Link href="/immunefi" className=" text-primary leading-6 mt-4">
                              Immunefi
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between pb-12 mt-11">
                        <a href="https://twitter.com/Popcorn_DAO">
                          <TwitterIcon color="fill-primary" size={"30"} />
                        </a>
                        <a href="https://discord.gg/w9zeRTSZsq">
                          <DiscordIcon color="fill-primary" size={"30"} />
                        </a>
                        <a href="https://t.me/popcorndaochat">
                          <TelegramIcon color="fill-primary" size={"30"} />
                        </a>
                        <a href="https://medium.com/popcorndao">
                          <MediumIcon color="fill-primary" size={"30"} />
                        </a>
                        <a href="https://www.reddit.com/r/popcorndao/">
                          <RedditIcon color="fill-primary" size={"30"} />
                        </a>
                        <a href="https://www.youtube.com/channel/UCe8n8mGG4JR7nhFT4v9APyA">
                          <YoutubeIcon color="fill-primary" size={"30"} />
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

      <Transition.Root show={showVoteMenu} as={Fragment}>
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
                  <div className="h-screen px-6 py-12">
                    <div className="relative flex items-center justify-center" style={{ height: "5%" }}>
                      <button className="absolute -left-3 transform -translate-y-1/2 top-1/2">
                        <ChevronLeftIcon className="text-black h-10" onClick={() => setShowVoteMenu(false)} />
                      </button>
                      <p className="text-black text-center font-medium leading-[140%]">Vote Now</p>
                      <div />
                    </div>
                    <ul className="flex flex-col gap-10 justify-center" style={{ height: "95%" }}>
                      <li className="mt-1" onClick={() => setShowVoteMenu(false)}>
                        <NavbarLink
                          label="Beneficiary Applications"
                          url="/applications"
                          isActive={router.pathname === `/applications`}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <PopUpModal visible={showPopUp} onClosePopUpModal={() => setSowPopup(false)}>
        <div className="py-4">
          <p className="mb-2 leading-[140%]">{account ? "Disconnect from" : "Connect to"} wallet</p>
          <Button
            variant={account ? "secondary" : "primary"}
            className="w-full"
            onClick={account ? handleDisconnectWallet : handleConnectWallet}
          >
            {account ? "Disconnect from" : "Connect to"} Polygon
          </Button>
        </div>
      </PopUpModal>
    </>
  );
};
