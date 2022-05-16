import {
  AtSymbolIcon,
  ClipboardCheckIcon,
  DocumentReportIcon,
  PhotographIcon,
  SupportIcon,
} from "@heroicons/react/outline";
import Button from "components/CommonComponents/Button";
import Link from "next/link";
import React, { ReactElement } from "react";
import styled from "styled-components";

interface ApplicationRequirements {
  icon: ReactElement;
  title: string;
  content: string;
}

const requirements: Array<ApplicationRequirements> = [
  {
    icon: <ClipboardCheckIcon />,
    title: "Basic Information",
    content:
      "Here is the basic information you would need to complete your application: the organization name, the title of your application, the proposal category, the organization's mission statement, the official email address, and all links to your social accounts.",
  },
  {
    icon: <SupportIcon />,
    title: "Proof of Ownership",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus rhoncus, blandit at porta viverra. Nunc, convallis aenean sed faucibus quis facilisis tincidunt morbi sapien. Hendrerit ",
  },
  {
    icon: <AtSymbolIcon />,
    title: "ETH Address",
    content: "The associated ETH address to receive fundings",
  },
  {
    icon: <DocumentReportIcon />,
    title: "Impact Report/Audits",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus rhoncus, blandit at porta viverra. Nunc, convallis aenean sed faucibus quis facilisis tincidunt morbi sapien. Hendrerit",
  },
  {
    icon: <PhotographIcon />,
    title: "Visual content",
    content:
      "Upload photos and videos to better your chance and show our community the things your organization had done, achieved, and the impacts created.",
  },
];

const ApplyPage = () => {
  return (
    <main>
      <div className="relative">
        <HeroSection>
          <h2 className="font-semibold text-6xl text-white text-center pt-40">Create an application</h2>
        </HeroSection>
        <div className="container mx-auto absolute top-80 md:-bottom-84 transform left-1/2 -translate-x-1/2">
          <div className="bg-yellow rounded-4xl p-5 md:p-20 mx-5 md:mx-10">
            <div className="grid grid-cols-12 md:gap-10">
              <div className="col-span-12 md:col-span-6 mb-10 md:mb-0">
                <p className="text-3xl mb-5 text-gray-900 font-semibold">
                  Here are a few things to know before applying to become an Eligible Beneficiary.
                </p>
                <p className=" text-gray-900 font-semibold text-xl"> How to become an eligilible beneficiary?</p>
                <p className=" text-gray-900 text-xl">
                  For an organization to become an eligible grant recipient, a Beneficiary Nomination Proposal (BNP)
                  must be raised and the proposal must receive a majority of votes case towards “ Yes” with at least 10%
                  of the available supply of governance tokens voting “Yes”
                </p>
              </div>

              <div className="col-span-12 md:col-span-6">
                <div className="mb-10">
                  <p className=" text-gray-900 font-semibold text-xl"> Token requirement</p>
                  <p className=" text-gray-900 text-xl">
                    An organization wishing to apply for eligible beneficiary status may acquire the requisite of 2000
                    POP tokens or reach out to the Popcorn Foundation to seek a nomination at no cost.
                  </p>
                </div>

                <div>
                  <p className=" text-gray-900 font-semibold text-xl">What you need to complete the application?</p>
                  <p className=" text-gray-900 text-xl">
                    Supplementary application materials, such as mission statement, proof of address ownership, photos,
                    links to social media accounts, and provide impact reports.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Link href="/apply/form">
                <a>
                  <Button variant="primary" className="py-3 px-5 mt-10">
                    Create An Application
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="">
        <div className="container mx-auto mb-20 apply-card">
          <div className="">
            <h3 className=" px-5 md:px-10 text-gray-900 font-semibold text-4xl my-10">List of Requirements</h3>
            <div className="flex flex-wrap md:mb-10">
              {requirements.map((requirement, index) => (
                <div className="px-5 md:px-10 mb-10 md-mb-0 md:basis-1/2 lg:basis-1/3 grow" key={index}>
                  <div className="w-10 h-10 rounded-full bg-customBlue flex justify-center items-center mb-6">
                    <div className="w-5 h-5 text-gray-900">{requirement.icon}</div>
                  </div>
                  <p className=" font-semibold text-xl text-gray-900 mb-2">{requirement.title}</p>
                  <p className="text-gray-500">{requirement.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const HeroSection = styled.div`
  height: 600px;
  background-image: url("/images/apply/applybg.png");
  background-size: cover;
  background-repeat: no-repeat;
  @media screen and (min-width: 768px) and (max-width: 999px) {
    height: 800px;
  }
`;

export default ApplyPage;
