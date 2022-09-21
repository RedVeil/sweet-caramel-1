import { Web3Provider } from "@ethersproject/providers";
import {
  AtSymbolIcon,
  ClipboardCheckIcon,
  DocumentReportIcon,
  IdentificationIcon,
  PhotographIcon,
} from "@heroicons/react/outline";
import { useWeb3React } from "@web3-react/core";
import Button from "components/CommonComponents/Button";
import { connectors } from "context/Web3/connectors";
import Link from "next/link";
import React from "react";

interface RequirementsObject {
  icon: JSX.Element;
  title: string;
  content?: string;
  children?: JSX.Element;
}

const ApplyPage = () => {
  const requirements: Array<RequirementsObject> = [
    {
      icon: <ClipboardCheckIcon />,
      title: "Fit at least into one of the four categories",
      children: (
        <div className="text-gray-500">
          <p>
            In order to be considered as a potential beneficiary, your organisation must aid social impact efforts in
            one of the following four domains:
          </p>
          <ol className="pl-4 list-decimal">
            <li>Environment</li>
            <li> Free and open-source software</li>
            <li>Education</li>
            <li> Inequality</li>
          </ol>
          <p>
            Fill out the{" "}
            <a href="/" className="text-customPurple">
              Popcorn Foundation Social Impact Questionnaire
            </a>
          </p>
        </div>
      ),
    },
    {
      icon: <PhotographIcon />,
      title: "Visual Presentation",
      content: `A logo image file with a maximum size of 400KB. A square (1:1) PNG file with a transparent background is recommended.
			Two image files that best represents your work with a definition of minimum 300dpi, one in portrait and one in landscape orientation.`,
    },
    {
      icon: <AtSymbolIcon />,
      title: "ETH Address",
      children: (
        <p className="text-gray-500">
          Beneficiaries should have an Ethereum address for their address to be certified and approved or be onboarded
          and verified with one of the following crypto giving platforms:
          <span className="text-customPurple"> TheGivingBlock </span>
          or <span className="text-customPurple">Giveth</span>. The beneficiary address should be verifiably controlled
          by the recipient. Proof (e.g. social media).
        </p>
      ),
    },
    {
      icon: <DocumentReportIcon />,
      title: "Required Reporting",
      content:
        "If a proposal is successful at the grant selection competition, the beneficiary will be required to provide updates (including narratives, photos, videos) on status of the use of fund provided. A brief final report also will be required where with a summary of the accomplishments of work and its impact on the communities supported.",
    },
    {
      icon: <IdentificationIcon />,
      title: "Signature",
      content:
        "I hereby certify that the information provided with this application form is true and accurate and I agree to provide updates and reports for the use of funds if granted.",
    },
  ];
  const context = useWeb3React<Web3Provider>();
  const { library, account, activate, active } = context;
  return (
    <main className="px-6 lg:px-8">
      <div className="relative">
        <div className="flex justify-between items-center py-10 md:py-18">
          <h1 className="text-black text-6xl leading-12">
            Create <br className="hidden md:block" />
            an application
          </h1>
          <img src="images/apply/applyHeroImage.svg" alt="" className="hidden md:block" />
        </div>
        <div className="bg-customYellow rounded-lg px-6 py-10 lg:p-20">
          <div className="container mx-auto ">
            <div className="grid grid-cols-12 md:gap-10">
              <div className="col-span-12 md:col-span-7 mb-6 md:mb-0">
                <p className=" text-2xl md:text-5xl leading-7 md:leading-12 font-medium md:font-normal mb-10 text-gray-900">
                  Here are a few things to know before applying to become an Eligible Beneficiary.
                </p>
                <p className=" text-black font-medium">How can my organization qualify as a beneficiary?</p>
                <p className=" text-primaryDark">
                  To be considered for a grant, your organization must submit an application that meets two criteria:
                  <ol className=" list-decimal pl-5 pt-2">
                    <li>A majority of votes must be cast in favor of the application.</li>
                    <li>
                      The organization must address Popcorn's areas of focus (education, environment, open source).
                    </li>
                  </ol>
                </p>
              </div>

              <div className="col-span-12 md:col-span-5">
                <div className="mb-6 md:mb-10">
                  <p className=" text-black font-medium"> Does my organization need POP tokens?</p>
                  <p className=" text-primaryDark">
                    An organization may apply for eligible beneficiary status by purchasing the required 2000 POP tokens
                    or contacting the Popcorn Foundation for a free nomination.
                  </p>
                </div>

                <div>
                  <p className=" text-black font-medium">What else is needed to complete the application?</p>
                  <p className=" text-primaryDark">
                    Supplementary application materials, such as a mission statement, proof of address ownership,
                    photos, links to social media accounts, and impact reports, are required.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              {account ? (
                <Link href="/apply/form">
                  <a className="w-full md:w-auto">
                    <Button variant="secondary" className="py-3 px-5 mt-10 w-full">
                      Start Your Application
                    </Button>
                  </a>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  className="py-3 px-5 mt-10 w-full md:w-auto"
                  onClick={() => activate(connectors.Injected)}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="my-10 md:my-20">
        <h3 className=" text-gray-900 text-3xl leading-10 mb-8 md:mb-20 ">List of Requirements</h3>
        <div className="flex flex-col md:flex-row md:flex-wrap md:gap-28 md:mb-10">
          {requirements.map((requirement, index) => (
            <div className="mb-8 md:mb-0 md:basis-1/4 grow" key={index}>
              <div className="w-20 h-20 rounded-full border-3 border-black flex justify-center items-center mb-4 md:mb-6">
                <div className="w-8 h-8 text-gray-900">{requirement.icon}</div>
              </div>
              <p className="text-2xl leading-8 text-gray-900 mb-2">{requirement.title}</p>
              {requirement?.content && <p className="text-gray-500">{requirement.content}</p>}
              {requirement?.children && <div>{requirement.children}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warmGray rounded-lg p-8 hidden md:flex flex-col justify-between">
        <h2 className="text-black text-4xl leading-10 mb-20">
          Blockchain-enabled <br /> wealth management <br /> and social impact.
        </h2>
        <div className=" mt-2">
          <img src="images/apply/applySocialImapct.svg" alt="" />
        </div>
      </div>
    </main>
  );
};

export default ApplyPage;
