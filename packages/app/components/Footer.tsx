import Link from "next/link";
import React, { useEffect, useState } from "react";
import SecondaryButton from "./SecondaryActionButton";
import DiscordIcon from "./SVGIcons/DiscordIcon";
import FacebookIcon from "./SVGIcons/FacebookIcon";
import GithubIcon from "./SVGIcons/GithubIcon";
import TwitterIcon from "./SVGIcons/TwitterIcon";

const Footer = () => {
  const [facebookColor, setFacebookColor] = useState("#645F4B");
  const [twitterColor, setTwitterColor] = useState("#645F4B");
  const [githubColor, setGithubColor] = useState("#645F4B");
  const [discordColor, setDiscordColor] = useState("#645F4B");

  const [iconSize, setIconSize] = useState("24");

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setIconSize("50");
      setFacebookColor("#111827");
      setTwitterColor("#111827");
      setGithubColor("#111827");
      setDiscordColor("#111827");
    }
  }, []);

  const onHoverIcon = (setFunction) => {
    setFunction("#000000");
  };

  const onLeaveIcon = (setFunction) => {
    setFunction("#645F4B");
  };
  return (
    <footer className="grid grid-cols-12 md:gap-14 px-6 md:px-8 pb-10 mt-20 font-landing">
      <div className="col-span-12 md:col-span-3 order-1 md:order-1">
        <div className="bg-customYellow rounded-lg py-3 text-center font-medium text-customDarkGray">
          Any questions? Let’s chat!
        </div>
        <form
          action="https://network.us1.list-manage.com/subscribe/post?u=5ce5e82d673fd2cfaf12849a5&amp;id=e85a091ed3"
          method="post"
          id="mc-embedded-subscribe-form"
          name="mc-embedded-subscribe-form"
          className="validate mt-12"
          target="_blank"
          noValidate
        >
          <h6 className="px-1 leading-6">Contact Us</h6>
          <input
            type="email"
            name="EMAIL"
            id="mce-EMAIL"
            className="border-x-0 border-y-dropdownBorder text-primaryDark placeholder-primaryDark px-1 py-2 w-full mt-2 leading-7"
            placeholder="Enter your email"
            required
          />
          <div style={{ position: "absolute", left: "-5000px" }} aria-hidden="true">
            <input type="text" name="b_5ce5e82d673fd2cfaf12849a5_e85a091ed3" tabIndex={-1} />
          </div>
          <div className="px-1 py-2 border-b border-dropdownBorder">
            <SecondaryButton
              label="Submit"
              handleClick={(e) => {
                (window as unknown as any).lintrk("track", {
                  conversionId: "5594906",
                });
              }}
            />
          </div>
        </form>
      </div>
      <div className="col-span-12 md:col-span-6 flex flex-col justify-between order-3 md:order-2 mt-12 md:mt-0">
        <p className=" text-primaryDark leading-6 order-2 md:order-1 mt-8 md:mt-0">
          Popcorn is a carbon-neutral wealth management application that leverages blockchain technology to earn
          competitive yields.
        </p>
        <div className="flex justify-between md:justify-start md:gap-7 order-1 md:order-2">
          <a
            href="https://www.facebook.com/PopcornDAO"
            onMouseEnter={() => onHoverIcon(setFacebookColor)}
            onMouseLeave={() => onLeaveIcon(setFacebookColor)}
          >
            <FacebookIcon color={facebookColor} size={iconSize} />
          </a>
          <a
            href="https://twitter.com/Popcorn_DAO"
            onMouseEnter={() => onHoverIcon(setTwitterColor)}
            onMouseLeave={() => onLeaveIcon(setTwitterColor)}
          >
            <TwitterIcon color={twitterColor} size={iconSize} />
          </a>
          <a
            href="https://github.com/popcorndao"
            onMouseEnter={() => onHoverIcon(setGithubColor)}
            onMouseLeave={() => onLeaveIcon(setGithubColor)}
          >
            <GithubIcon color={githubColor} size={iconSize} />
          </a>
          <a
            href="https://discord.gg/w9zeRTSZsq"
            onMouseEnter={() => onHoverIcon(setDiscordColor)}
            onMouseLeave={() => onLeaveIcon(setDiscordColor)}
          >
            <DiscordIcon color={discordColor} size={iconSize} />
          </a>
        </div>
      </div>

      <div className="col-span-12 md:col-span-3 flex flex-col md:flex-row  gap-12 md:gap-0 md:justify-between order-2 md:order-3 mt-12 md:mt-0">
        <div>
          <p className="text-gray-900 font-medium leading-6 tracking-1">Products</p>
          <div className="flex flex-col">
            <Link href="/">
              <a className=" text-primary hover:text-black leading-6 mt-4">Sweet Vaults</a>
            </Link>
            <Link href="/set/3x">
              <a className=" text-primary hover:text-black leading-6 mt-4">3X</a>
            </Link>
            <Link href="/set/butter">
              <a className=" text-primary hover:text-black leading-6 mt-4">Butter</a>
            </Link>
            <Link href="/staking">
              <a className=" text-primary hover:text-black leading-6 mt-4">Staking</a>
            </Link>
          </div>
        </div>

        <div>
          <p className="text-gray-900 font-medium leading-6 tracking-1">Links</p>
          <div className="flex flex-col">
            <Link href="/">
              <a className=" text-primary hover:text-black leading-6 mt-4">Popcorn</a>
            </Link>
            <Link href="/rewards">
              <a className=" text-primary hover:text-black leading-6 mt-4">Rewards</a>
            </Link>
          </div>
        </div>

        <div>
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
    </footer>
  );
};

export default Footer;
