import { BeneficiaryApplication } from "@popcorn/hardhat/lib/adapters";
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
    <div className={`grid grid-cols-12 ${pageType === "beneficiary" ? "md:gap-14" : ""}`}>
      <div className={benClasses().firstDiv}>
        <h6 className=" text-gray-900 text-2xl font-semibold mb-5">Overview</h6>
        <p className=" text-gray-900">{missionStatement || ""}</p>
      </div>

      <div className={benClasses().secondDiv}>
        {pageType === "proposal" && <hr className="my-18 md:hidden" />}

        <div
          className={`grid md:gap-14 ${pageType === "beneficiary" ? "grid-cols-6 md:pb-14" : "grid-cols-2 md:pb-28"}`}
        >
          <div className={`${pageType === "beneficiary" ? "col-span-6" : "col-span-2 md:col-span-1"} mt-14 md:mt-0`}>
            <h6 className=" text-gray-900 text-2xl font-semibold mb-5">Ethereum Address</h6>
            <p className=" text-gray-900 break-all">{beneficiaryAddress || ""}</p>
          </div>

          <div className={`${pageType === "beneficiary" ? "col-span-6" : "col-span-2 md:col-span-1"} mt-14 md:mt-0`}>
            <h6 className=" text-gray-900 text-2xl font-semibold mb-5">Proof of Ownership</h6>
            <a href={links?.proofOfOwnership} className=" text-gray-900 break-all">
              {links?.proofOfOwnership}
            </a>
          </div>
        </div>

        <hr className="my-18 md:hidden" />

        {pageType === "proposal" && <hr className="my-18 md:hidden" />}

        <div className={`grid md:gap-14 ${pageType === "beneficiary" ? "grid-cols-6" : "grid-cols-2 md:pb-28"}`}>
          {links?.website && (
            <div className={`${pageType === "beneficiary" ? "col-span-6" : "col-span-2 md:col-span-1"}`}>
              <h6 className=" text-gray-900 text-2xl font-semibold mb-5">Website</h6>
              <a href={links?.website} className=" text-gray-900">
                {links?.website}
              </a>
            </div>
          )}

          <div className={`${pageType === "beneficiary" ? "col-span-6" : "col-span-2 md:col-span-1"} mt-14 md:mt-0`}>
            <h6 className=" text-gray-900 text-2xl font-semibold mb-5">Follow us on socials</h6>
            <div className="flex gap-6 md:gap-8">
              {links?.twitterUrl && (
                <a
                  href={links?.twitterUrl}
                  className="bg-blue-600 w-12 h-12 rounded-full flex justify-center items-center"
                >
                  <img src="/images/twitterWhiteIcon.svg" alt="" />
                </a>
              )}
              {links?.telegramUrl && (
                <a
                  href={links?.telegramUrl}
                  className="bg-blue-600 w-12 h-12 rounded-full flex justify-center items-center"
                >
                  <img src="/images/telegramWhiteIcon.svg" alt="" />
                </a>
              )}
              {links?.linkedinUrl && (
                <a
                  href={links?.linkedinUrl}
                  className="bg-blue-600 w-12 h-12 rounded-full flex justify-center items-center"
                >
                  <img src="/images/linkedinWhiteIcon.svg" alt="" />
                </a>
              )}
              {links?.signalUrl && (
                <a
                  href={links?.signalUrl}
                  className="bg-blue-600 w-12 h-12 rounded-full flex justify-center items-center"
                >
                  <img src="/images/signalWhiteIcon.svg" alt="" />
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
