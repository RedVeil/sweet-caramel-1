import React, { useState } from "react";
import TokenInputToggle from "@popcorn/app/components/TokenInputToggle";
import MainActionButton from "@popcorn/app/components/MainActionButton";
import SecondaryActionButton from "@popcorn/app/components/SecondaryActionButton";
import SlippageSettings from "@popcorn/app/components/BatchButter/SlippageSettings";

enum InteractionType {
  Deposit,
  Withdraw,
}

interface SweetVaultsFormProps {
  submitForm: () => void;
  TokenInput: React.ReactNode;
}

const SweetVaultsForm = ({ submitForm, TokenInput }: SweetVaultsFormProps) => {
  const [interactionType, setInteractionType] = useState<InteractionType>(InteractionType.Deposit);
  const [slippage, setSlippage] = useState(0);

  const toggleInterface = () =>
    setInteractionType(
      interactionType === InteractionType.Deposit ? InteractionType.Withdraw : InteractionType.Deposit,
    );

  return (
    <div className="bg-white rounded-lg p-6 border border-customLightGray">
      <div>
        <TokenInputToggle
          state={[interactionType !== InteractionType.Deposit, toggleInterface]}
          labels={["Deposit", "Withdraw"]}
        />

        <div className="mt-10 mb-11">
          {/* TokenInput component form @popcorn/app */}
          {TokenInput}
        </div>

        <div className="mb-11">
          <SlippageSettings slippage={slippage} setSlippage={setSlippage} slippageOptions={[0.1, 0.5, 1]} />
        </div>

        <div className="rounded-lg bg-warmGray bg-opacity-[15%] p-4 mb-10">
          <SecondaryActionButton label={<span className="font-normal">Popcorn fees breakdown</span>} />
        </div>
        <MainActionButton label="Deposit & Stake" handleClick={submitForm} />
      </div>
    </div>
  );
};

export default SweetVaultsForm;
