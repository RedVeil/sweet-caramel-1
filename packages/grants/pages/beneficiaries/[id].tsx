import { BeneficiaryApplication } from "helper/types";
import { ExclamationIcon, ShareIcon } from "@heroicons/react/outline";
import { BeneficiaryRegistryAdapter } from "helper/adapters";
import { IpfsClient } from "@popcorn/utils";
import SocialShare from "components/CommonComponents/SocialShare";
import AboutTab from "components/Profile/AboutTab";
import GalleryTab from "components/Profile/GalleryTab";
import ReportsTab from "components/Profile/ReportsTab";
import { ContractsContext } from "context/Web3/contracts";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { RWebShare } from "react-web-share";
import capitalize from "../../utils/capitalizeFirstLetter";
import styled from "styled-components";
import { setSingleActionModal } from "context/actions";
import { store } from "context/store";

const BeneficiaryPage = () => {
  const profileTabs = ["about", "gallery", "reports"];

  const router = useRouter();
  const { contracts } = useContext(ContractsContext);
  const [beneficiary, setBeneficiary] = useState<BeneficiaryApplication>();
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>();
  const [currentTab, setCurrentTab] = useState<string>("about");

  const { dispatch } = useContext(store);

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

  const shareProfile = () => {
    dispatch(
      setSingleActionModal({
        content: `Share this profile to anyone and help to promote this impact project.`,
        title: "Share & Spread Awareness",
        visible: true,
        image: <img src="/images/shareModal.svg" />,
        onDismiss: {
          onClick: () => dispatch(setSingleActionModal({ visible: false })),
        },
        children: (
          <SocialShare
            url={router.asPath}
            title={`Share ${beneficiary?.organizationName}'s Proposal`}
            text={"Popcorn is a regenerative yield optimizing protocol"}
          />
        ),
      }),
    );
  };

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
                className=" w-36 h-36 rounded-full object-cover hidden md:block"
              />
              <div>
                <p className="text-customLightGray text-base leading-7 uppercase">{beneficiary?.proposalCategory}</p>
                <h3 className="text-black text-5xl md:text-6xl my-2 md:my-4 leading-11">{beneficiary?.projectName}</h3>
                <p className="text-primaryDark text-base">by {beneficiary?.organizationName}</p>
              </div>
            </div>
            <div className="py-10 flex">
              <button
                onClick={shareProfile}
                className="border border-primary md:hidden bg-white h-12 w-12 rounded-full flex justify-center items-center"
              >
                <ShareIcon className="w-6 h-6 text-primary" />
              </button>
            </div>
            <div className="flex justify-between md:justify-start md:space-x-4 pb-10 md:pb-20 md:pt-14">
              {profileTabs.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-[28px] px-5 py-3 text-lg border ${
                    currentTab == tab
                      ? "text-white bg-[#827D69] border-[#827D69]"
                      : "text-[#55503D] bg-white border-customLightGray"
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
