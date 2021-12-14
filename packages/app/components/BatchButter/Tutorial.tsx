import { useState } from 'react';
import * as Icon from 'react-feather';

function title(step: number): string {
  switch (step) {
    case 1:
      return 'Step 1 - Mint your Butter';
    case 2:
      return 'Step 2 – Wait for the batch progression';
    case 3:
      return 'Step 3 – Mint Executed';
  }
}

function text(step: number): string {
  switch (step) {
    case 1:
      return 'Connect Metamask, approve the contract as a first-time user and you are ready to mint Butter. Each time you mint, your asset is put in a batch with other users. This helps you to reduce your gas cost.';
    case 2:
      return 'The batch will automatically be processed when it reaches $100k of deposits. You can cancel anytime before the batch was processed.';
    case 3:
      return 'The mint record module will appear when you have successfully added funds for the batch. You can cancel a batch when it is still in progress. Once the batch is completed, you can claim your Butter.';
  }
}

function tutorialContent(step: number): JSX.Element {
  switch (step) {
    case 1:
      return (
        <div className="w-full h-56 flex flex-row items-center justify-center">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-10/12 laptop:w-9/12 xl:w-7/12 2xl:w-9/12"
          />
        </div>
      );
    case 2:
      return (
        <div className="w-full h-56 flex flex-row items-center justify-center">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-10/12 smlaptop:w-9/12 xl:w-7/12 2xl:w-9/12"
          />
        </div>
      );
    case 3:
      return (
        <div className="w-full h-56 flex flex-row items-center justify-center">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-9/12 smlaptop:w-8/12 laptop:w-7/12 xl:w-5/12 2xl:w-8/12"
          />
        </div>
      );
  }
}

const Tutorial: React.FC = () => {
  const [step, setStep] = useState<number>(1);

  return (
    <div className="w-full h-full flex flex-row">
      <div className="w-2/12 flex items-center justify-center">
        <button
          className="w-20 h-20 rounded-full bg-white opacity-50 flex justify-center items-center shadow-custom hover:opacity-70"
          onClick={() => setStep(step === 1 ? 3 : step - 1)}
        >
          <Icon.ChevronLeft className="text-primary h-14 w-14 mr-2 opacity-40" />
        </button>
      </div>
      <div className="w-8/12 pt-2 h-104 smlaptop:h-100 xl:h-104">
        {tutorialContent(step)}
        <h2 className="font-semibold leading-none text-center text-gray-600 laptop:mt-8 xl:mt-12">
          How it works
        </h2>
        <h1 className="font-bold leading-none text-center text-2xl mt-6">
          {title(step)}
        </h1>
        <p className="text-center mt-4">{text(step)}</p>
      </div>
      <div className="w-2/12 flex items-center justify-center">
        <button
          className="w-20 h-20 rounded-full bg-white opacity-50 flex justify-center items-center shadow-custom hover:opacity-70"
          onClick={() => setStep(step === 3 ? 1 : step + 1)}
        >
          <Icon.ChevronRight className="text-primary h-14 w-14 ml-2 opacity-40" />
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
