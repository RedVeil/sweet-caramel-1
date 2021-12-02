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
      return 'Connect your Metamask Wallet, approve the contract as a first-time user, and you are ready to mint Butter. Each time you mint, your asset is put on a queue for batch processing. This process gives you the best deal to acquire Butter.';
    case 2:
      return 'The batch will automatically processes when it reach 100k of deposit amount and you can cancel anytime while the process still on progress. The batch process is proposed to reduce your gas fee';
    case 3:
      return 'The batch will automatically processes when it reach 100k of deposit amount and you can cancel anytime while the process still on progress. The batch process is proposed to reduce your gas fee';
  }
}

function tutorialContent(step: number): JSX.Element {
  switch (step) {
    case 1:
      return (
        <div className="w-full h-56">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-8/12 ml-20"
          />
        </div>
      );
    case 2:
      return (
        <div className="w-full h-56">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-8/12 ml-18"
          />
        </div>
      );
    case 3:
      return (
        <div className="w-full h-56">
          <img
            src={`/images/butter/Step-${step}.png`}
            className="w-7/12 ml-28 pl-2"
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
      <div className="w-8/12">
        {tutorialContent(step)}
        <h2 className="font-semibold leading-none text-center text-gray-600">
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
