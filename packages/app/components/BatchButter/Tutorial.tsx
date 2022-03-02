import { useState } from "react";
import * as Icon from "react-feather";
import MobileTutorialStepButton from "./MobileTutorialStepButton";

function title(step: number): string {
  switch (step) {
    case 1:
      return "Step 1 - Begin the Minting Process";
    case 2:
      return "Step 2 – Wait for the batch to process";
    case 3:
      return "Step 3 – Claim your minted Butter!";
  }
}

function text(step: number): string {
  switch (step) {
    case 1:
      return "First connect your wallet. Then select the token you would like to deposit from the dropdown, enter the deposit amount and click ‘Mint’. If you are depositing for the first time, you’ll need to approve the contract.";
    case 2:
      return "Your deposits will be held in Butter’s batch processing queue. Note: To minimise gas fees, deposits are processed approximately every 24 hours. You are able to withdraw your deposits during this phase.";
    case 3:
      return "Once the batch has been processed, you will be able to claim the new minted Butter tokens!";
  }
}

function tutorialContent(step: number): JSX.Element {
  switch (step) {
    case 1:
      return (
        <div className="w-full h-auto flex flex-row items-center justify-center">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-full md:w-10/12 laptop:w-9/12 xl:w-7/12 2xl:w-9/12"
          />
        </div>
      );
    case 2:
      return (
        <div className="w-full h-auto flex flex-row items-center justify-center">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-full md:w-10/12 smlaptop:w-9/12 xl:w-7/12 2xl:w-9/12"
          />
        </div>
      );
    case 3:
      return (
        <div className="w-full h-auto flex flex-row items-center justify-center">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-full md:w-10/12 smlaptop:w-9/12 xl:w-7/12 2xl:w-9/12"
          />
        </div>
      );
  }
}

const Tutorial: React.FC = () => {
  const [step, setStep] = useState<number>(1);

  return (
    <>
      <div className="w-full h-10/12 flex flex-col md:flex-row md:items-center bg-primaryLight px-6 py-6 md:p-0 rounded-3xl border md:border-none border-gray-200 shadow-custom md:shadow-none">
        <div className="hidden w-2/12 md:flex items-center justify-center">
          <button
            className="w-20 h-20 rounded-full bg-white opacity-50 flex justify-center items-center shadow-custom hover:opacity-70"
            onClick={() => setStep(step === 1 ? 3 : step - 1)}
          >
            <Icon.ChevronLeft className="text-primary h-14 w-14 mr-2 opacity-40" />
          </button>
        </div>
        <div
          className="w-full h-full justify-center md:w-8/12 pt-2 md:h-auto flex flex-col"
          onClick={() => setStep(step === 3 ? 1 : step + 1)}
        >
          {tutorialContent(step)}
          <h2 className="font-semibold leading-none text-center text-gray-600 mt-4">How it works</h2>
          <h1 className="font-bold leading-none text-center text-2xl mt-6">{title(step)}</h1>
          <p className="text-center mt-4">{text(step)}</p>
        </div>
        <div className="hidden w-2/12 md:flex items-center justify-center">
          <button
            className="w-20 h-20 rounded-full bg-white opacity-50 flex justify-center items-center shadow-custom hover:opacity-70"
            onClick={() => setStep(step === 3 ? 1 : step + 1)}
          >
            <Icon.ChevronRight className="text-primary h-14 w-14 ml-2 opacity-40" />
          </button>
        </div>
      </div>
      <div className="flex flex-row md:hidden items-center justify-center space-x-4 mt-4">
        <MobileTutorialStepButton stepState={[step, setStep]} activeState={1} />
        <MobileTutorialStepButton stepState={[step, setStep]} activeState={2} />
        <MobileTutorialStepButton stepState={[step, setStep]} activeState={3} />
      </div>
    </>
  );
};

export default Tutorial;
