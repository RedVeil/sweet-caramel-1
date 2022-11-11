import { ChevronLeftIcon, ExclamationIcon, ShareIcon } from "@heroicons/react/outline";
import { BeneficiaryApplication, BeneficiaryRegistryAdapter } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import AboutTab from "components/Profile/AboutTab";
import GalleryTab from "components/Profile/GalleryTab";
import ReportsTab from "components/Profile/ReportsTab";
import { ContractsContext } from "context/Web3/contracts";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { RWebShare } from "react-web-share";
import styled from "styled-components";
import capitalize from "../../utils/capitalizeFirstLetter";
import { store } from "context/store";
import { setSingleActionModal } from "context/actions";
import SocialShare from "components/CommonComponents/SocialShare";

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
      <div className="md:hidden mb-10 px-6">
        <Link href={"/beneficiaries"}>
          <a className="flex space-x-2">
            <ChevronLeftIcon className="text-secondaryLight w-4" />
            <p className="text-primary">Eligible Beneficiaries</p>
          </a>
        </Link>
      </div>
      <Hero bgImage={`${process.env.IPFS_URL}${beneficiary?.files?.headerImage?.image}`} className="relative">
        <div className="flex absolute gap-4 bottom-10 left-8">
          <button onClick={shareProfile} className=" opacity-80 bg-white border-white rounded-3xl text-black font-medium hidden md:flex px-5 py-3 gap-3 shadow-white-button ">
            <ShareIcon className="w-6 h-6" />
            Share
          </button>
          {/* <Link href="/profile/edit">
            <a>
              <button className=" opacity-80 bg-white border-white rounded-3xl text-black font-medium hidden md:flex px-5 py-3 gap-3 shadow-white-button ">
                <ExclamationIcon className="w-6 h-6" />
                Edit Profile
              </button>
            </a>
          </Link> */}
        </div>
      </Hero>
      <div className="hidden md:block mx-8 mt-8">
        <Link href={"/beneficiaries"}>
          <a className="flex space-x-2">
            <ChevronLeftIcon className="text-secondaryLight w-4" />
            <p className="text-primary">Eligible Beneficiaries</p>
          </a>
        </Link>
      </div>
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
                <h3 className="text-black text-5xl md:text-6xl my-4 leading-11">{beneficiary?.projectName}</h3>
                <p className="text-primaryDark text-base leading-7">by {beneficiary?.organizationName}</p>
              </div>
            </div>
            <div className="py-10 flex">
              <button onClick={shareProfile} className="border border-primary bg-white h-12 w-12 rounded-full flex md:hidden justify-center items-center">
                <ShareIcon className="w-6 h-6 text-primary" />
              </button>
            </div>
            <div className="flex justify-between md:justify-start md:space-x-4 pb-10 md:pb-20 md:pt-14">
              {profileTabs.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-[28px] px-5 py-3 text-lg border ${currentTab == tab
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
  height: 65vh;
  background-image: ${({ bgImage }) => `url(${bgImage})` || ""};
  background-size: cover;
  background-position: center;
  @media screen and (max-width: 767px) {
    margin: 0 24px;
    border-radius: 8px;
    height: 185px;
  }
`;

export default BeneficiaryPage;
