import React, { useContext, useState } from "react";
import TokenInputToggle from "@popcorn/app/components/TokenInputToggle";
import MainActionButton from "@popcorn/app/components/MainActionButton";
import SecondaryActionButton from "@popcorn/app/components/SecondaryActionButton";
import SlippageSettings from "@popcorn/app/components/BatchButter/SlippageSettings";
import { store } from "@popcorn/components/context/store";
import { setSingleActionModal } from "@popcorn/components/context/actions";
import feesModalImage from "@popcorn/components/public/images/feesBreakdownModal.svg";
import Image from "next/image";

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
  const { dispatch } = useContext(store);

  const toggleInterface = () =>
    setInteractionType(
      interactionType === InteractionType.Deposit ? InteractionType.Withdraw : InteractionType.Deposit,
    );

  const openFeesBreakdownModal = () => {
    dispatch(
      setSingleActionModal({
        children: <FeesBreakDown />,
        image: <Image src={feesModalImage} alt="fees image" width={80} height={80} />,
        onDismiss: {
          onClick: () => dispatch(setSingleActionModal(false)),
        },
      }),
    );
  };

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
          <SecondaryActionButton
            label={<span className="font-normal">Popcorn fees breakdown</span>}
            handleClick={openFeesBreakdownModal}
          />
        </div>
        <MainActionButton label="Deposit & Stake" handleClick={submitForm} />
      </div>
    </div>
  );
};

export default SweetVaultsForm;

const FeesBreakDown = () => {
  return (
    <div>
      <h3 className=" text-2xl text-primaryDark mb-8">Fees are presubstracted from APY.</h3>
      <ul className="space-y-4">
        <li className="flex justify-between text-lg text-[#737373]">
          <p>Deposit Fee</p>
          <p>0%</p>
        </li>
        <li className="flex justify-between text-lg text-[#737373]">
          <p>Withdrawal fee</p>
          <p>0%</p>
        </li>
        <li className="flex justify-between text-lg text-[#737373]">
          <p>Management fee</p>
          <p>0%</p>
        </li>
        <li className="flex justify-between text-lg text-[#737373]">
          <p>Performance fee</p>
          <p>0%</p>
        </li>
      </ul>
    </div>
  );
};
