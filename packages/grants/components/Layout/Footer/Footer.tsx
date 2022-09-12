import NewsLetterSubscription from "components/CommonComponents/NewsLetterSubscription";
import {
  DiscordIcon,
  TelegramIcon,
  MediumIcon,
  RedditIcon,
  YoutubeIcon,
  TwitterIcon
} from "components/Svgs";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState, Dispatch, SetStateAction } from "react";

const Footer = () => {
  const [telegramColor, setTelegramColor] = useState("#645F4B");
  const [twitterColor, setTwitterColor] = useState("#645F4B");
  const [mediumIcon, setMediumColor] = useState("#645F4B");
  const [discordColor, setDiscordColor] = useState("#645F4B");
  const [redditColor, setRedditColor] = useState("#645F4B");
  const [youtubeColor, setYoutubeColor] = useState("#645F4B");

  const [iconSize, setIconSize] = useState("24");
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setIconSize("30");
      setTelegramColor("#645F4B");
      setTwitterColor("#645F4B");
      setMediumColor("#645F4B");
      setDiscordColor("#645F4B");
      setRedditColor("#645F4B");
      setYoutubeColor("#645F4B");
    }
  }, []);

  const onHoverIcon = (setFunction: Dispatch<SetStateAction<string>>) => {
    setFunction("#000000");
  };

  const onLeaveIcon = (setFunction: Dispatch<SetStateAction<string>>) => {
    setFunction("#645F4B");
  };
  return (
    <footer className="grid grid-cols-12 md:gap-8 laptop:gap-14  px-6 md:px-8 pb-10 mt-12 md:mt-20 font-landing">
      <div className="col-span-12 md:col-span-4 order-1 md:order-1">
        <div className="bg-customYellow rounded-lg py-3 text-center font-medium text-black">
          Have you got questions? Let’s chat :)
        </div>
        <NewsLetterSubscription title="Contact Us" buttonLabel="Submit" />
      </div>
      <div className="col-span-12 md:col-span-4 flex flex-col justify-between order-3 md:order-2 mt-12 md:mt-0">
        <p className=" text-primaryDark leading-6 order-2 md:order-1 mt-8 md:mt-0">
          Popcorn is an audited, non-custodial DeFi wealth manager with yield-generating
          products that simultaneously fund nonprofit and social impact organizations.
        </p>
        <div className="flex justify-between order-1 md:order-2">
          <a
            href="https://twitter.com/Popcorn_DAO"
            onMouseEnter={() => onHoverIcon(setTwitterColor)}
            onMouseLeave={() => onLeaveIcon(setTwitterColor)}
          >
            <TwitterIcon color={twitterColor} size={iconSize} />
          </a>
          <a
            href="https://discord.gg/w9zeRTSZsq"
            onMouseEnter={() => onHoverIcon(setDiscordColor)}
            onMouseLeave={() => onLeaveIcon(setDiscordColor)}
          >
            <DiscordIcon color={discordColor} size={iconSize} />
          </a>
          <a
            href="https://t.me/popcorndaochat"
            onMouseEnter={() => onHoverIcon(setTelegramColor)}
            onMouseLeave={() => onLeaveIcon(setTelegramColor)}
          >
            <TelegramIcon color={telegramColor} size={iconSize} />
          </a>
          <a
            href="https://medium.com/popcorndao"
            onMouseEnter={() => onHoverIcon(setMediumColor)}
            onMouseLeave={() => onLeaveIcon(setMediumColor)}
          >
            <MediumIcon color={mediumIcon} size={iconSize} />
          </a>
          <a
            href="https://www.reddit.com/r/popcorndao/"
            onMouseEnter={() => onHoverIcon(setRedditColor)}
            onMouseLeave={() => onLeaveIcon(setRedditColor)}
          >
            <RedditIcon color={redditColor} size={iconSize} />
          </a>
          <a
            href="https://www.youtube.com/channel/UCe8n8mGG4JR7nhFT4v9APyA"
            onMouseEnter={() => onHoverIcon(setYoutubeColor)}
            onMouseLeave={() => onLeaveIcon(setYoutubeColor)}
          >
            <YoutubeIcon color={youtubeColor} size={iconSize} />
          </a>
        </div>
      </div>
      <div className="col-span-12 md:col-span-4 flex flex-col md:flex-row gap-12 md:gap-0 md:justify-between order-2 md:order-3 mt-12 md:mt-0">
        <div>
          <p className="text-gray-900 font-medium leading-6 tracking-1">Site</p>
          <div className="flex flex-col">
            <Link href={`/${router?.query?.network}/set/3x`}>
              <a className=" text-primary hover:text-black leading-6 mt-4">Beneficiary Applications</a>
            </Link>
            <Link href={`/${router?.query?.network}/set/butter`}>
              <a className=" text-primary hover:text-black leading-6 mt-4">Eligible Beneficiaries</a>
            </Link>
          </div>
        </div>
        <div>
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
