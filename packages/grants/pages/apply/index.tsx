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
import React, { ReactElement } from "react";
import styled from "styled-components";

interface RequirementsObject {
  icon: ReactElement;
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
            <a href="/" className="text-blue-600 font-semibold">
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
          <span className="text-blue-600 font-semibold"> TheGivingBlock </span>
          or <span className="text-blue-600 font-semibold">Giveth</span>. The beneficiary address should be verifiably
          controlled by the recipient. Proof (e.g. social media).
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
    <main>
      <div className="relative">
        <HeroSection>
          <div className="apply-overlay absolute w-full bg-black bg-opacity-50"></div>
          <h2 className=" font-semibold text-4xl md:text-6xl text-white text-center pt-40 relative z-10">
            Create an application
          </h2>
        </HeroSection>
        <div className="container mx-auto absolute top-80 md:-bottom-84 transform left-1/2 -translate-x-1/2">
          <div className="bg-yellow rounded-4xl p-5 md:p-20 mx-5 md:mx-10">
            <div className="grid grid-cols-12 md:gap-10">
              <div className="col-span-12 md:col-span-6 mb-10 md:mb-0">
                <p className="text-3xl mb-5 text-gray-900 font-semibold">
                  Here are a few things to know before applying to become an Eligible Beneficiary.
                </p>
                <p className=" text-gray-900 font-semibold text-xl">
                  How can my organization qualify as a beneficiary?
                </p>
                <p className=" text-gray-900 text-xl">
                  To be considered for a grant, your organization must submit an application that meets two criteria:
                  <ol className=" list-decimal pl-5">
                    <li className="my-3">A majority of votes must be cast in favor of the application.</li>
                    <li className="my-3">
                      The organization must address Popcorn's areas of focus (education, environment, open source).
                    </li>
                  </ol>
                </p>
              </div>

              <div className="col-span-12 md:col-span-6">
                <div className="mb-10">
                  <p className=" text-gray-900 font-semibold text-xl"> Does my organization need POP tokens?</p>
                  <p className=" text-gray-900 text-xl">
                    An organization may apply for eligible beneficiary status by purchasing the required 2000 POP tokens
                    or contacting the Popcorn Foundation for a free nomination.
                  </p>
                </div>

                <div>
                  <p className=" text-gray-900 font-semibold text-xl">
                    What else is needed to complete the application?
                  </p>
                  <p className=" text-gray-900 text-xl">
                    Supplementary application materials, such as a mission statement, proof of address ownership,
                    photos, links to social media accounts, and impact reports, are required.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              {account ? (
                <Link href="/apply/form">
                  <a>
                    <Button variant="primary" className="py-3 px-5 mt-10">
                      Apply Now
                    </Button>
                  </a>
                </Link>
              ) : (
                <Button variant="primary" className="py-3 px-5 mt-10" onClick={() => activate(connectors.Injected)}>
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mb-20 apply-card">
        <div className="px-5 md:px-10">
          <h3 className=" text-gray-900 font-semibold text-4xl my-10 ">List of Requirements</h3>
          <div className="flex flex-wrap md:mb-10">
            {requirements.map((requirement, index) => (
              <div className="px-5 md:px-10 mb-10 md-mb-0 md:basis-1/2 lg:basis-1/3 grow" key={index}>
                <div className="w-10 h-10 rounded-full bg-customBlue flex justify-center items-center mb-6">
                  <div className="w-5 h-5 text-gray-900">{requirement.icon}</div>
                </div>
                <p className=" font-semibold text-xl text-gray-900 mb-2">{requirement.title}</p>
                {requirement?.content && <p className="text-gray-500">{requirement.content}</p>}
                {requirement?.children && <div>{requirement.children}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

const HeroSection = styled.div`
  height: 600px;
  background-image: url("/images/apply/applybg.jpg");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: 0 50%;
  @media screen and (min-width: 768px) and (max-width: 999px) {
    height: 800px;
  }
`;

export default ApplyPage;
