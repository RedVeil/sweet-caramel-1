import NewsLetterSubscription from "components/CommonComponents/NewsLetterSubscription";
import { DiscordIcon, MediumIcon, RedditIcon, TelegramIcon, TwitterIcon, YoutubeIcon } from "components/Svgs";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const Footer = () => {
  const [iconSize, setIconSize] = useState("24");
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setIconSize("30");
    }
  }, []);
  return (
    <footer className="grid grid-cols-12 md:gap-8 2xl:gap-14 pb-10 mt-12 md:mt-20 px-6 lg:px-8">
      <div className="col-span-12 md:col-span-4 order-1 md:order-1">
        <div className="bg-customYellow rounded-lg py-3 text-center font-medium text-black">
          Have you got questions? Let’s chat :)
        </div>
        <NewsLetterSubscription title="Contact Us" buttonLabel="Submit" />
      </div>
      <div className="col-span-12 md:col-span-4 flex flex-col justify-between order-3 md:order-2 mt-12 md:mt-0">
        <p className=" text-primaryDark leading-6 order-2 md:order-1 mt-8 md:mt-0">
          Popcorn is an audited, non-custodial DeFi wealth manager with yield-generating products that simultaneously
          fund nonprofit and social impact organizations.
        </p>
        <div className="flex justify-between order-1 md:order-2">
          <a href="https://twitter.com/Popcorn_DAO">
            <TwitterIcon color="fill-primary hover:fill-black" size={iconSize} />
          </a>
          <a href="https://discord.gg/w9zeRTSZsq">
            <DiscordIcon color="fill-primary hover:fill-black" size={iconSize} />
          </a>
          <a href="https://t.me/popcorndaochat">
            <TelegramIcon color="fill-primary hover:fill-black" size={iconSize} />
          </a>
          <a href="https://medium.com/popcorndao">
            <MediumIcon color="fill-primary hover:fill-black" size={iconSize} />
          </a>
          <a href="https://www.reddit.com/r/popcorndao/">
            <RedditIcon color="fill-primary hover:fill-black" size={iconSize} />
          </a>
          <a href="https://www.youtube.com/channel/UCe8n8mGG4JR7nhFT4v9APyA">
            <YoutubeIcon color="fill-primary hover:fill-black" size={iconSize} />
          </a>
        </div>
      </div>
      <div className="col-span-12 md:col-span-4 flex flex-col md:flex-row space-x-0 md:space-x-5 md:justify-between order-2 md:order-3 mt-12 md:mt-0">
        <div>
          <p className="text-gray-900 font-medium leading-6 tracking-1">Site</p>
          <div className="flex flex-col">
            <Link href="/applications">
              <a className=" text-primary hover:text-black leading-6 mt-4">Beneficiary Applications</a>
            </Link>
            <Link href="/beneficiaries">
              <a className=" text-primary hover:text-black leading-6 mt-4">Eligible Beneficiaries</a>
            </Link>
          </div>
        </div>
        <div className="mt-8 mt-md:0">
          <p className="text-gray-900 font-medium leading-6 tracking-1">Contact Us</p>
          <div className="flex flex-col">
            <a className=" text-primary hover:text-black leading-6 mt-4" href="mailto:info@popcorn.foundation">
              info@popcorn.foundation
            </a>
          </div>
          <div className="flex flex-col mt-8">
            <p className="text-gray-900 font-medium leading-6 tracking-1">Bug Bounty</p>
            <div className="flex flex-col">
              <Link href="https://immunefi.com/bounty/popcornnetwork" passHref>
                <a target="_blank" className=" text-primary hover:text-black leading-6 mt-4">
                  Immunefi
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
