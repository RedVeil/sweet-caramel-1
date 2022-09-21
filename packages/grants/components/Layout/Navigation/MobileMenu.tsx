import { Dialog, Transition } from "@headlessui/react";
import { DocumentAddIcon, ChevronLeftIcon } from "@heroicons/react/outline";
import { DiscordIcon, MediumIcon, RedditIcon, TelegramIcon, TwitterIcon, YoutubeIcon } from "components/Svgs";
import { useRouter } from "next/router";
import { Fragment, useEffect, useState } from "react";
import Button from "components/CommonComponents/Button";
import Link from "next/link";
import NavbarLink from "./NavbarLink";

export const MobileMenu: React.FC = () => {
  const router = useRouter();
  const [menuVisible, toggleMenu] = useState<boolean>(false);
  const [showVoteMenu, setShowVoteMenu] = useState<boolean>(false);

  useEffect(() => {
    toggleMenu(false);
  }, [router?.pathname]);

  return (
    <>
      <div className="flex flex-row justify-between items-center h-full">
        <div>
          <Link href="/" passHref>
            <a>
              <img src="/images/popLogo.svg" alt="Logo" className="w-10 h-10" />
            </a>
          </Link>
        </div>
        <div className="flex items-center space-x-6">
          {!menuVisible && (
            <>
              <Link href="/apply" passHref>
                <button className="bg-transparent border-primary text-primary rounded-4xl text-base flex flex-row items-center justify-center font-medium px-5 py-1.5 border transition-all ease-in-out duration-500">
                  <DocumentAddIcon className="text-primary w-5 h-5" />
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
                        <Button variant="secondary" className="w-full" onClick={() => router.push('/apply')}>
                          Create Proposal
                        </Button>
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
                        <ChevronLeftIcon
                          className="text-black h-10"
                          onClick={() => setShowVoteMenu(false)}
                        />
                      </button>
                      <p className="text-black text-center font-medium">Vote Now</p>
                      <div />
                    </div>
                    <ul className="flex flex-col gap-10 justify-center" style={{ height: "95%" }}>
                      <li className="mt-1" onClick={() => setShowVoteMenu(false)}>
                        <NavbarLink label="Beneficiary Applications" url="/applications" isActive={router.pathname === `/applications`} />
                      </li>
                    </ul>
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
