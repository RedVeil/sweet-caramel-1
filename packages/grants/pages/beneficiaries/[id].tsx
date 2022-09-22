import { ExclamationIcon, ShareIcon } from "@heroicons/react/outline";
import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import AboutTab from "components/Profile/AboutTab";
import GalleryTab from "components/Profile/GalleryTab";
import ReportsTab from "components/Profile/ReportsTab";
import { ContractsContext } from "context/Web3/contracts";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { RWebShare } from "react-web-share";
import styled from "styled-components";
import capitalize from "../../utils/capitalizeFirstLetter";

const BeneficiaryPage = () => {
  const profileTabs = ["about", "gallery", "reports"];

  const router = useRouter();
  const { contracts } = useContext(ContractsContext);
  const [beneficiary, setBeneficiary] = useState<BeneficiaryApplication>();
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>();
  const [currentTab, setCurrentTab] = useState<string>("about");

  useEffect(() => {
    const { id } = router.query;
    if (id && id !== beneficiaryAddress) setBeneficiaryAddress(id as string);
  }, [router, beneficiaryAddress]);
  useEffect(() => {
    if (contracts?.beneficiaryRegistry && beneficiaryAddress) {
      BeneficiaryRegistryAdapter(contracts.beneficiaryRegistry, IpfsClient)
        .getBeneficiaryApplication(beneficiaryAddress)
        .then((beneficiaryApplication) => {
          console.log(beneficiaryApplication);

          setBeneficiary(beneficiaryApplication);
        });
    }
  }, [contracts, beneficiaryAddress]);
  return (
    <section className="relative">
      <Hero bgImage={`${process.env.IPFS_URL}${beneficiary?.files?.headerImage?.image}`} className="relative">
        <div className="flex gap-4 absolute bottom-10 right-5 md:right-10 xl:right-28 md:mr-1">
          <RWebShare
            data={{
              url: router.asPath,
              title: `Share ${beneficiary?.organizationName}'s Proposal`,
            }}
          >
            <button className=" opacity-80 bg-white border-gray-200 rounded-3xl text-gray-900 font-semibold flex px-5 py-3 gap-3 shadow-white-button">
              <ShareIcon className="w-6 h-6" />
              Share
            </button>
          </RWebShare>
          <button className=" opacity-80 bg-white border-gray-200 rounded-3xl text-gray-900 font-semibold flex px-5 py-3 gap-3 shadow-white-button">
            <ExclamationIcon className="w-6 h-6" />
            Report
          </button>
        </div>
      </Hero>
      <div className="container mx-auto">
        <div className="grid grid-cols-12 px-5 lg:px-10">
          <div className="col-span-12 py-20">
            <div className="flex items-center gap-3">
              <img
                src={`${process.env.IPFS_URL}${beneficiary?.files?.profileImage?.image}`}
                alt={beneficiary?.files?.profileImage?.description || "profile-image"}
                className=" w-20 h-20 rounded-full object-cover"
              />
              <div>
                <p className="text-gray-400 text-lg uppercase">{beneficiary?.proposalCategory}</p>
                <h3 className="text-gray-900 text-3xl md:text-5xl font-semibold my-2">{beneficiary?.projectName}</h3>
                <p className="text-gray-900 text-lg">by {beneficiary?.organizationName}</p>
              </div>
            </div>
            <div className="flex justify-center gap-10 md:gap-20 pb-18 md:py-24 mt-16 md:mt-0">
              {profileTabs.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-3xl px-5 py-3 font-semibold text-lg ${
                    currentTab == tab ? "text-blue-600 bg-blue-50" : "text-gray-500 bg-white"
                  }`}
                  onClick={() => setCurrentTab(tab)}
                >
                  {capitalize(tab)}
                </button>
              ))}
            </div>

            {currentTab == "about" && <AboutTab {...beneficiary} pageType="beneficiary" />}
            {currentTab == "gallery" && (
              <GalleryTab additionalImages={beneficiary.files.additionalImages} rowsPercent={33} />
            )}
            {currentTab == "reports" && <ReportsTab reports={beneficiary.files.impactReports} />}
          </div>
        </div>
      </div>
    </section>
  );
};
interface HeroProps {
  bgImage: string;
}
const Hero = styled.div<HeroProps>`
  height: 80vh;
  background-image: ${({ bgImage }) => `url(${bgImage})` || ""};
  background-size: cover;
  background-position: center;
`;

export default BeneficiaryPage;
