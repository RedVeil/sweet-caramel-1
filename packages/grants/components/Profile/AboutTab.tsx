import { BeneficiaryApplication } from "@popcorn/hardhat/lib/adapters";
import { TelegramIcon, TwitterIcon } from "components/Svgs";
import LinkedInIcon from "components/Svgs/LinkedInIcon";
import SignalIcon from "components/Svgs/SignalIcon";
import React from "react";

interface AboutTabProps {
  missionStatement: string;
  beneficiaryAddress: string;
  links: BeneficiaryApplication["links"];
  pageType: string;
}

const AboutTab: React.FC<AboutTabProps> = ({ missionStatement, beneficiaryAddress, links, pageType }) => {
  const benClasses = () => {
    if (pageType === "beneficiary") {
      return {
        firstDiv: "col-span-12 lg:col-span-7 xl:col-span-8 md:pb-28",
        secondDiv: "col-span-12 lg:col-span-5 xl:col-span-4",
      };
    }
    return {
      firstDiv: "col-span-12 md:pb-28",
      secondDiv: "col-span-12",
    };
  };
  return (
    <ul>
      <li className="pb-10">
        <h6 className=" text-gray-900 text-3xl mb-5 font-semibold">Overview</h6>
        <p className=" text-primaryDark leading-6">{missionStatement || ""}</p>
      </li>
      <li className="p-4 border border-customLightGray rounded-lg mb-2">
        <h6 className="text-black text-base leading-6 font-semibold">Ethereum Address</h6>
        <p className=" text-primaryDark leading-6 break-all">{beneficiaryAddress || ""}</p>
      </li>
      {links?.website && (
        <li className="p-4 border border-customLightGray rounded-lg mb-2">
          <h6 className=" text-black text-base leading-6 font-semibold">Website</h6>
          <a href={links?.website} className=" text-primaryDark leading-6">
            {links?.website}
          </a>
        </li>
      )}
      <li className="p-4 border border-customLightGray rounded-lg mb-2">
        <h6 className=" text-black text-base leading-6 font-semibold">Proof of Ownership</h6>
        <a href={links?.proofOfOwnership} className=" text-primaryDark leading-6 break-all">
          {links?.proofOfOwnership}
        </a>
      </li>
      <li className="p-4 border border-customLightGray rounded-lg">
        <h6 className=" text-black text-base leading-6 font-semibold mb-2">Follow us on socials</h6>
        <div className="flex space-x-4 md:space-x-6 items-center">
          {links?.twitterUrl && (
            <a href={links?.twitterUrl} className="flex justify-center items-center">
              <TwitterIcon color="fill-primary" size="32" />
            </a>
          )}
          {links?.telegramUrl && (
            <a href={links?.telegramUrl} className="flex justify-center items-center">
              <TelegramIcon color="fill-primary" size="32" />
            </a>
          )}
          {links?.signalUrl && (
            <a href={links?.signalUrl} className="flex justify-center items-center">
              <SignalIcon color="fill-primary" size="32" />
            </a>
          )}
          {links?.linkedinUrl && (
            <a href={links?.linkedinUrl} className="flex justify-center items-center">
              <LinkedInIcon color="fill-primary" size="32" />
            </a>
          )}
        </div>
      </li>
    </ul>
  );
};

export default AboutTab;
