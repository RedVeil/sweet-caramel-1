import useNetworkName from "@popcorn/app/hooks/useNetworkName";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useFeatures } from "@popcorn/components/hooks/useFeatures";
import GithubIcon from "@popcorn/app/components/SVGIcons/GithubIcon";

const Footer = () => {
  const [defaultColor, setColor] = useState("#645F4B");

  const [iconSize, setIconSize] = useState("24");
  const networkName = useNetworkName();
  const {
    features: { sweetVaults: displaySweetVaults },
  } = useFeatures();

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setIconSize("30");
      setColor("#645F4B");
    }
  }, []);

  const onHoverIcon = (setFunction) => {
    setColor("#000000");
  };

  const onLeaveIcon = (setFunction) => {
    setColor("#645F4B");
  };
  return (
    <footer className="grid grid-cols-12 md:gap-8 laptop:gap-14  px-6 md:px-8 pb-10 mt-12 md:mt-20 font-landing">
      <div className="col-span-12 md:col-span-3 order-1 md:order-1">
        <p className=" text-primaryDark leading-6 order-2 md:order-1 mt-8 md:mt-0">
          Popcorn is a multi-chain regenerative yield optimizing protocol.
        </p>
      </div>

      <div className="flex justify-between md:justify-start md:space-x-7 order-1 md:order-2">
        <a
          href="https://github.com/popcorndao"
          onMouseEnter={() => onHoverIcon(defaultColor)}
          onMouseLeave={() => onLeaveIcon(defaultColor)}
        >
          <GithubIcon color={defaultColor} size={iconSize} />
        </a>
      </div>
      <div className="col-span-12 md:col-span-6 flex flex-col justify-between order-3 md:order-2 mt-12 md:mt-0"></div>

      <div className="col-span-12 md:col-span-3 flex flex-col md:flex-row  gap-12 md:gap-0 md:justify-between order-2 md:order-3 mt-12 md:mt-0">
        <div>
          <p className="text-gray-900 font-medium leading-6 tracking-1">Products</p>
          <div className="flex flex-col">
            {displaySweetVaults && (
              <Link href="/" className=" text-primary hover:text-black leading-6 mt-4">
                Sweet Vaults
              </Link>
            )}
            <Link href={`/${networkName}/set/3x`} className=" text-primary hover:text-black leading-6 mt-4">
              3X
            </Link>
            <Link href={`/${networkName}/set/butter`} className=" text-primary hover:text-black leading-6 mt-4">
              Butter
            </Link>
            <Link href="/staking" className=" text-primary hover:text-black leading-6 mt-4">
              Staking
            </Link>
          </div>
        </div>

        <div>
          <p className="text-gray-900 font-medium leading-6 tracking-1">Links</p>
          <div className="flex flex-col">
            <Link href="/" className=" text-primary hover:text-black leading-6 mt-4">
              Popcorn
            </Link>
            <Link href="/rewards" className=" text-primary hover:text-black leading-6 mt-4">
              Rewards
            </Link>
            <Link
              href="https://popcorn-dao.gitbook.io/popcorndao-gitbook/about-popcorn/welcome-to-popcorn"
              target="_blank"
              className=" text-primary hover:text-black leading-6 mt-4"
            >
              Gitbook
            </Link>
            <Link
              href="https://github.com/popcorndao"
              target="_blank"
              className=" text-primary hover:text-black leading-6 mt-4"
            >
              GitHub
            </Link>
          </div>
        </div>

        <div>
          <p className="text-gray-900 font-medium leading-6 tracking-1">Bug Bounty</p>
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
    </footer>
  );
};

export default Footer;
