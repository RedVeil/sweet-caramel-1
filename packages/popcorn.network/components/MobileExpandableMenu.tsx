import Link from "next/link";

import React from "react";
import { useRouter } from "next/router";
import PrimaryButton from "./CommonComponents/PrimaryButton";
import DiscordIcon from "./SVGIcons/DiscordIcon";
import TwitterIcon from "./SVGIcons/TwitterIcon";
import TelegramIcon from "./SVGIcons/TelegramIcon";
import MediumIcon from "./SVGIcons/MediumIcon";
import RedditIcon from "./SVGIcons/RedditIcon";
import YoutubeIcon from "./SVGIcons/YoutubeIcon";

const navLinks = [
  {
    label: "Popcorn",
    link: "/",
    target: "_self",
  },
  {
    label: "Whitepaper",
    link: "/docs/popcorn_whitepaper.pdf",
    target: "_blank",
  },
];

export const MobileExpandableMenu: React.FC = () => {
  const router = useRouter();

  return (
    <div className="z-10 nav-width overflow-y-auto">
      <div className="relative w-full min-h-screen h-full transition-opacity duration-1000 ease-in-out ">
        <div className="w-screen h-full overflow-y-auto px-6 mx-auto nav-animation flex flex-col justify-between bg-white">
          <div>
            <div className=" pt-32 flex flex-col gap-10">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.link}
                  className={` text-5xl leading-11 hover:text-black ${
                    router.pathname === link.link ? "text-black font-medium" : "text-primary"
                  }`}
                  target={link.target}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className=" mt-10">
              <a href="https://www.popcorndao.finance/" className="w-full block" target="_blank">
                <PrimaryButton>Launch App</PrimaryButton>
              </a>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-12 mt-20">
              <div className="col-span-6">
                <p className="text-gray-900 font-medium leading-6 tracking-1">Links</p>
                <div className="flex flex-col">
                  <Link href="/" className=" text-primary leading-6 mt-4">
                    Popcorn
                  </Link>
                  <Link href="/docs/popcorn_whitepaper.pdf" target="_blank" className=" text-primary leading-6 mt-4">
                    Whitepaper
                  </Link>
                </div>
              </div>

              <div className="col-span-6">
                <p className="text-gray-900 font-medium leading-6 tracking-1">Bug Bounty</p>
                <div className="flex flex-col">
                  <Link href="https://immunefi.com/bounty/popcornnetwork" className=" text-primary leading-6 mt-4">
                    Immunefi
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
    </div>
  );
};
