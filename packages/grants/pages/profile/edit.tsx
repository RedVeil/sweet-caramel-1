import { Web3Provider } from "@ethersproject/providers";
import { Transition } from "@headlessui/react";
import { ChevronDownIcon, ChevronLeftIcon } from "@heroicons/react/outline";
import { BeneficiaryApplication, BeneficiaryGovernanceAdapter, Proposal } from "@popcorn/hardhat/lib/adapters";
import { IpfsClient } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import ApplyForm from "components/Apply/ApplyForm";
import Button from "components/CommonComponents/Button";
import { ContractsContext } from "context/Web3/contracts";
import Link from "next/link";
import Router from "next/router";
import { defaultFormData, FormSteps } from "pages/apply/form";
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";

const EditPage = () => {
  const { contracts } = useContext(ContractsContext);
  const { account } = useWeb3React<Web3Provider>();

  const [activeForm, setActiveForm] = useState<FormSteps>(FormSteps.GENERAL_INFORMATION);
  const [proposalId, setProposalId] = useState<string>(null);
  const [proposal, setProposal] = useState<Proposal>();
  const [formData, setFormData] = useState<BeneficiaryApplication>(defaultFormData);
  const [showPopUp, setShowPopUp] = useState<boolean>(true);
  const [showTabs, setShowTabs] = useState<boolean>(false);

  useEffect(() => {
    if (contracts?.beneficiaryGovernance && proposalId) {
      fetchPageDetails();
    }
  }, [contracts, account, proposalId]);

  const fetchPageDetails = () => {
    new BeneficiaryGovernanceAdapter(contracts.beneficiaryGovernance, IpfsClient)
      .getProposal(Number(proposalId))
      .then((proposalData) => {
        if (proposalData.application.beneficiaryAddress == account) {
          setFormData(proposalData.application);
          setProposal(proposalData);
        } else Router.push("/");
      })
      .catch((err) => console.log(err.message));
  };

  const nextActiveForm = () => {
    let step = activeForm + 1;
    window.scrollTo(0, 0);
    setActiveForm(step);
  };

  const prevActiveForm = () => {
    let step = activeForm - 1;
    window.scrollTo(0, 0);
    setActiveForm(step);
  };

  const updateStep = (step: FormSteps) => {
    setActiveForm(step);
  };

  const saveChanges = () => {
    console.log(formData);
  };

  const getPopModalHeight = () => {
    let height;
    if (showTabs) {
      height = "580px";
    } else height = "265px";
    return height;
  };

  const toggleVotes = () => {
    setShowTabs(!showTabs);
  };

  const isElemTop = (ele: Element) => {
    const { bottom, height, top } = ele.getBoundingClientRect();
    if (top <= 0) {
      setShowPopUp(false);
    } else setShowPopUp(true);
  };

  useEffect(() => {
    setProposalId(localStorage.getItem("profileID"));
    const profileContent = document.querySelector("#formContent");
    window.addEventListener("scroll", () => isElemTop(profileContent));
  }, []);

  return (
    <section className="px-6 md:px-8">
      <div>
        <Link href={"/beneficiaries"} className="flex space-x-2">
          <ChevronLeftIcon className="text-secondaryLight w-4" />
          <p className="text-primary">Profile Page</p>
        </Link>
      </div>
      <h1 className="text-black text-6xl hidden md:block mt-14 leading-11">Edit Profile</h1>

      <div className="grid grid-cols-12 md:gap-8 mt-10 md:mt-14 mb-20">
        <div className="col-span-3 hidden md:block">
          <MenuTab
            formData={formData}
            proposal={proposal?.application}
            saveChanges={saveChanges}
            activeForm={activeForm}
            updateStep={updateStep}
          />
        </div>

        <div className="col-span-12 md:col-span-9" id="formContent">
          <ApplyForm
            form={[formData, setFormData]}
            onNextActiveForm={nextActiveForm}
            onPrevActiveForm={prevActiveForm}
            activeForm={activeForm}
          />
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

      <Transition
        show={showPopUp}
        enter="transition-opacity duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute left-0">
          <div className="fixed bottom-0 z-20 lg:hidden w-full">
            <MenuCardCon
              className={`bg-white rounded-t-4xl shadow-voting-card-mobile md:shadow-none p-6 md:p-8 transition-all duration-1000 ease-in-out md:h-full relative left-0`}
              mobileHeight={getPopModalHeight()}
            >
              <div
                className={`lg:hidden flex justify-center mb-5 transition-all duration-300 transform ${
                  !showTabs ? " rotate-180" : ""
                }`}
              >
                <ChevronDownIcon className="animate-bounce text-secondaryLight w-5" onClick={toggleVotes} />
              </div>
              <h1 className="text-black text-3xl md:hidden my-6 leading-8">Edit Profile</h1>
              <MenuTab
                formData={formData}
                proposal={proposal?.application}
                saveChanges={saveChanges}
                activeForm={activeForm}
                updateStep={updateStep}
                showButtons={showTabs}
              />
            </MenuCardCon>
          </div>
        </div>
      </Transition>
    </section>
  );
};
interface MenuTabProps {
  formData: BeneficiaryApplication;
  proposal: BeneficiaryApplication;
  saveChanges: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  activeForm: FormSteps;
  updateStep: Function;
  showButtons?: boolean;
}
const MenuTab: React.FC<MenuTabProps> = ({
  formData,
  proposal,
  saveChanges,
  activeForm,
  updateStep,
  showButtons = true,
}) => {
  const stepList: Array<{
    title: string;
    id: FormSteps;
  }> = [
    { id: FormSteps.GENERAL_INFORMATION, title: "General Information" },
    { id: FormSteps.PROOFS, title: "Proofs" },
    { id: FormSteps.IMPACT_REPORTS, title: "Impact Reports" },
    { id: FormSteps.VISUAL_CONTENT, title: "Visual Content" },
  ];
  return (
    <>
      <Transition
        show={showButtons}
        enter="transition-opacity duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="space-y-3">
          {stepList.map((step) => (
            <button
              className={`rounded-lg p-3 text-lg border block w-full text-left border-[#827D69] ${
                step.id == activeForm ? "bg-[#827D69] text-white" : "bg-white text-[#827D69]"
              }`}
              key={step.id}
              onClick={() => updateStep(step.id)}
            >
              {step.title}
            </button>
          ))}
        </div>
        <hr className="bg-customLightGray my-8" />
      </Transition>
      <div>
        <Button variant="primary" className="w-full" onClick={saveChanges} disabled={proposal == formData}>
          Save and View Changes
        </Button>
        <Button variant="secondary" className="w-full mt-5">
          Cancel
        </Button>
      </div>
    </>
  );
};

interface CardProps {
  mobileHeight: string;
}
const MenuCardCon = styled.div<CardProps>`
  height: 100%;
  @media screen and (max-width: 999px) {
    height: ${({ mobileHeight }) => mobileHeight};
  }
`;

export default EditPage;
