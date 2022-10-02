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
    <div className={`grid grid-cols-12`}>
      <div className="col-span-12 md:pb-28">
        <h6 className=" text-gray-900 text-3xl mb-5">Overview</h6>
        <p className=" text-primaryDark leading-6">{missionStatement || ""}</p>
      </div>

      <div className="col-span-12">
        <div className={`grid md:gap-14 grid-cols-2 md:pb-20`}>
          <div className={`col-span-2 md:col-span-1 mt-14 md:mt-0`}>
            <h6 className=" text-black text-3xl leading-8 mb-4">Ethereum Address</h6>
            <p className=" text-primaryDark leading-6 break-all">{beneficiaryAddress || ""}</p>
          </div>

          <div className={`col-span-2 md:col-span-1 mt-14 md:mt-0`}>
            <h6 className=" text-black text-3xl leading-8 mb-4">Proof of Ownership</h6>
            <a href={links?.proofOfOwnership} className=" text-primaryDark leading-6 break-all">
              {links?.proofOfOwnership}
            </a>
          </div>
        </div>

        <div className={`grid md:gap-14 grid-cols-2`}>
          {links?.website && (
            <div className={`col-span-2 md:col-span-1 mt-14 md:mt-0`}>
              <h6 className=" text-black text-3xl leading-8 mb-4">Website</h6>
              <a href={links?.website} className=" text-primaryDark leading-6">
                {links?.website}
              </a>
            </div>
          )}

          <div className={`col-span-2 md:col-span-1 mt-14 md:mt-0`}>
            <h6 className=" text-black text-3xl leading-8 mb-4">Follow us on socials</h6>
            <div className="flex gap-6 md:gap-8">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutTab;
