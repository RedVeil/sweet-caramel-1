import NewsLetterSubscription from "components/CommonComponents/NewsLetterSubscription";
import { DiscordIcon, MediumIcon, RedditIcon, TelegramIcon, TwitterIcon, YoutubeIcon } from "components/Svgs";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const Footer = () => {
  const [iconSize, setIconSize] = useState("24");

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
        <p className=" text-primaryDark leading-[140%] order-2 md:order-1 mt-8 md:mt-0">
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
      <div className="col-span-12 md:col-span-4 flex flex-col-reverse md:flex-col order-2 md:order-3 mt-12 md:mt-0">
        <div className="grid grid-cols-2 gap-y-8 md:gap-16 mt-8 md:mt-0">
          <div className="col-span-2 md:col-span-1">
            <p className="text-gray-900 font-medium leading-[140%] tracking-1">Contact Us</p>
            <div className="flex flex-col">
              <a className=" text-primary hover:text-black leading-6 mt-4" href="mailto:info@popcorn.foundation">
                info@popcorn.foundation
              </a>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-gray-900 font-medium leading-[140%] tracking-1">Bug Bounty</p>
            <div className="flex flex-col">
              <Link
                href="https://immunefi.com/bounty/popcornnetwork"
                passHref
                target="_blank"
                className=" text-primary hover:text-black leading-6 mt-4"
              >
                Immunefi
              </Link>
            </div>
          </div>
        </div>
        <div className="md:mt-8">
          <p className="text-gray-900 font-medium leading-[140%] tracking-1">Links</p>
          <div className="grid grid-cols-2 md:gap-16">
            <div className="col-span-2 md:col-span-1 flex flex-col">
              <Link href="/" className=" text-primary hover:text-black leading-6 mt-4">
                Home
              </Link>
              <Link href="/applications" className=" text-primary hover:text-black leading-6 mt-4">
                Beneficiary Applications
              </Link>
              <Link href="/beneficiaries" className=" text-primary hover:text-black leading-6 mt-4">
                Eligible Beneficiaries
              </Link>
            </div>
            <div className="col-span-2 md:col-span-1 flex flex-col">
              {/* <Link href="/">
              <a className=" text-primary hover:text-black leading-6 mt-4">Grant Rounds</a>
            </Link>
            <Link href="/applications">
              <a className=" text-primary hover:text-black leading-6 mt-4">FAQ</a>
            </Link> */}
              <Link href="/applications" className=" text-primary hover:text-black leading-6 mt-4">
                Create Proposal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
