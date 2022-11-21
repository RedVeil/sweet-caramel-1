import { BeneficiaryApplication } from "@popcorn/hardhat/lib/adapters";
import classnames from "classnames";
import { TelegramIcon, TwitterIcon } from "components/Svgs";
import LinkedInIcon from "components/Svgs/LinkedInIcon";
import SignalIcon from "components/Svgs/SignalIcon";
import { useRouter } from "next/router";
import { useMemo } from "react";

interface AboutTabProps {
  missionStatement: string;
  beneficiaryAddress: string;
  links: BeneficiaryApplication["links"];
  pageType: string;
}

const AboutTab: React.FC<AboutTabProps> = ({ missionStatement, beneficiaryAddress, links, pageType }) => {
  const router = useRouter();
  const { pathname } = router;

  const isBeneficiaryPage = useMemo(() => {
    return pathname.includes("/beneficiaries/");
  }, [pathname]);

  return (
    <>
      <div className="pb-10">
        <h6 className=" text-gray-900 text-3xl mb-5 font-semibold leading-none">Overview</h6>
        <p className=" text-primaryDark leading-6">{missionStatement || ""}</p>
      </div>
      <div
        className={classnames("flex flex-col", {
          "flex-col md:flex-row lg:space-x-3": isBeneficiaryPage,
        })}
      >
        <div
          className={classnames("flex-grow w-full flex-shrink-0 mb-3", {
            "lg:w-1/2 mb-0": isBeneficiaryPage,
          })}
        >
          <div className="p-4 border border-customLightGray rounded-lg min-h-[100px] flex flex-col justify-center">
            <h6 className="text-black text-base leading-6 font-semibold">Ethereum Address</h6>
            <p className=" text-primaryDark leading-6 break-all">{beneficiaryAddress || ""}</p>
          </div>
        </div>
        {links?.website && (
          <div
            className={classnames("flex-grow w-full flex-shrink-0 mt-3 lg:mt-0", {
              "lg:w-1/2": isBeneficiaryPage,
            })}
          >
            <div className="p-4 border border-customLightGray rounded-lg min-h-[100px] flex flex-col justify-center">
              <h6 className=" text-black text-base leading-6 font-semibold">Website</h6>
              <a href={links?.website} className=" text-primaryDark leading-6">
                {links?.website}
              </a>
            </div>
          </div>
        )}
      </div>

      <div
        className={classnames("flex flex-col", {
          "flex-col md:flex-row lg:space-x-3": isBeneficiaryPage,
        })}
      >
        <div
          className={classnames("flex-grow w-full flex-shrink-0", {
            "lg:w-1/2 mb-0 lg:mb-0 mt-3": isBeneficiaryPage,
            "mt-3": !isBeneficiaryPage,
          })}
        >
          <div className="p-4 border border-customLightGray rounded-lg min-h-[100px] flex flex-col justify-center">
            <h6 className=" text-black text-base leading-6 font-semibold">Proof of Ownership</h6>
            <a href={links?.proofOfOwnership} className=" text-primaryDark leading-6 break-all">
              {links?.proofOfOwnership}
            </a>
          </div>
        </div>

        <div
          className={classnames("flex-grow w-full flex-shrink-0 mt-3", {
            "lg:w-1/2": isBeneficiaryPage,
          })}
        >
          <div className="p-4 border border-customLightGray rounded-lg min-h-[100px] flex flex-col justify-center">
            <h6 className=" text-black text-base leading-6 font-semibold mb-2">Follow us on socials</h6>
            <div className="flex space-x-4 md:space-x-6 items-center">
              {links?.twitterUrl && (
                <a href={links?.twitterUrl} className="flex justify-center items-center">
                  <TwitterIcon color="fill-primary" size="30" />
                </a>
              )}
              {links?.telegramUrl && (
                <a href={links?.telegramUrl} className="flex justify-center items-center">
                  <TelegramIcon color="fill-primary" size="30" />
                </a>
              )}
              {links?.signalUrl && (
                <a href={links?.signalUrl} className="flex justify-center items-center">
                  <SignalIcon color="fill-primary" size="30" />
                </a>
              )}
              {links?.linkedinUrl && (
                <a href={links?.linkedinUrl} className="flex justify-center items-center">
                  <LinkedInIcon color="fill-primary" size="30" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutTab;
