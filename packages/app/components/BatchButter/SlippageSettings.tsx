import { InfoIconWithModal } from "components/InfoIconWithModal";
import { setSingleActionModal } from "context/actions";
import { store } from "context/store";
import { escapeRegExp, inputRegex } from "helper/inputRegex";
import { Dispatch, useContext, useState } from "react";
import PseudoRadioButton from "./PseudoRadioButton";

interface SlippageSettingsProps {
  slippage: number;
  setSlippage: Dispatch<number>;
  slippageOptions: number[];
}

function SlippageModalContent({ slippage, setSlippage, slippageOptions }: SlippageSettingsProps) {
  const [value, setValue] = useState<string>(String(slippage));

  const onUpdate = (nextUserInput: string) => {
    if (inputRegex.test(escapeRegExp(nextUserInput))) {
      setValue(nextUserInput);
      setSlippage(Number(nextUserInput));
    }
  };

  return (
    <div className="mt-4 border border-gray-200 px-8 py-8 rounded-lg relative">
      <div className="flex flex-col">
        <div className="flex flex-row">
          <p className="text-left font-semibold mb-4">Slippage Tolerance</p>
          <div className="-mt-1 ml-1">
            <InfoIconWithModal
              title="Slippage Tolerance"
              content="Your transaction will revert if the price changes unfavorably by more than this percentage"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-between items-center mt-2 space-x-4">
        {slippageOptions.map((option) => (
          <PseudoRadioButton
            label={`${option} %`}
            isActive={value === String(option)}
            handleClick={() => {
              setValue(String(option));
              setSlippage(option);
            }}
          />
        ))}
      </div>
      <div className="mt-8">
        <div className="flex flex-row">
          <p className="mb-1 text-left font-semibold">Custom Adjustments</p>
          <div className="-mt-1 ml-1">
            <InfoIconWithModal title="Custom Adjustments" content="Input a custom slippage tolerance amount" />
          </div>
        </div>

        <div>
          <div className="mt-1 relative flex items-center">
            <input
              className="block w-full pl-5 pr-16 py-3.5 border-gray-200 font-semibold rounded-md leading-none text-gray-500 focus:text-gray-800 focus:outline-none"
              value={value}
              onChange={(e) => {
                onUpdate(e.target.value.replace(/,/g, "."));
              }}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              // text-specific options
              type="text"
              pattern="^[0-9]*[.,]?[0-9]*$"
              minLength={1}
              maxLength={4}
              spellCheck="false"
            />
            <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5 items-center">
              <p className="px-2 pb-1 pt-1.5 leading-none text-gray-500 font-semibold rounded-lg">%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SlippageSettings: React.FC<SlippageSettingsProps> = ({ slippage, setSlippage, slippageOptions }) => {
  const { dispatch } = useContext(store);

  return (
    <>
      <div
        className="flex flex-row items-center group cursor-pointer mt-2"
        onClick={() =>
          dispatch(
            setSingleActionModal({
              title: "Slippage",
              children: (
                <SlippageModalContent slippage={slippage} setSlippage={setSlippage} slippageOptions={slippageOptions} />
              ),
              onDismiss: { label: "Done", onClick: () => dispatch(setSingleActionModal(false)) },
            }),
          )
        }
      >
        <img className="w-4 h-4  group-hover:text-blue-600 text-gray-500" src="/images/icons/slippage.png" />
        <p className="text-base leading-none mt-0.5 ml-2 group-hover:text-blue-600 text-gray-500">
          {`Adjust slippage (${slippage}%)`}
        </p>
      </div>
    </>
  );
};

export default SlippageSettings;
