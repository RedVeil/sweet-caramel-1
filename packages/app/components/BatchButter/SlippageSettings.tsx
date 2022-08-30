import { InfoIconWithModal } from "components/InfoIconWithModal";
import { Dispatch, useState } from "react";
import PseudoRadioButton from "./PseudoRadioButton";

function getActiveButtonFromSlippage(slippage: number): number {
  switch (slippage) {
    case 0.1:
      return 0;
    case 0.5:
      return 1;
    case 1:
      return 2;
    default:
      return 3;
  }
}

interface SlippageSettingsProps {
  slippage: number;
  setSlippage: Dispatch<number>;
}

const SlippageSettings: React.FC<SlippageSettingsProps> = ({ slippage, setSlippage }) => {
  const [visible, setVisibility] = useState<boolean>(false);
  const [activeButton, setActiveButton] = useState<number>(getActiveButtonFromSlippage(slippage));
  const [value, setValue] = useState<number>(slippage);

  return (
    <>
      <div className="flex flex-row items-center group cursor-pointer mt-2" onClick={() => setVisibility(!visible)}>
        <img className={`w-4 h-4 ${visible ? "" : "text-primaryDark"}`} src="/images/icons/slippage.png" />
        <p className={`text-base leading-7 mt-0.5 ml-2 text-primaryDark`}>{`Adjust slippage (${slippage}%)`}</p>
      </div>
      {visible && (
        <div className="mt-4 border border-gray-200 p-6 rounded-lg relative">
          <div className="flex flex-col">
            <div className="flex flex-row items-center">
              <p className="text-left font-medium text-primary leading-7">Slippage Tolerance</p>
              <div className="ml-1">
                <InfoIconWithModal
                  title="Slippage Tolerance"
                  content="Your transaction will revert if the price changes unfavorably by more than this percentage"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-between items-center mt-6">
            <PseudoRadioButton
              label="0.1 %"
              isActive={activeButton === 0}
              handleClick={() => {
                setValue(0.1);
                setSlippage(0.1);
                setActiveButton(0);
              }}
            />
            <PseudoRadioButton
              label="0.5 %"
              isActive={activeButton === 1}
              handleClick={() => {
                setValue(0.5);
                setSlippage(0.5);
                setActiveButton(1);
              }}
            />
            <PseudoRadioButton
              label="1 %"
              isActive={activeButton === 2}
              handleClick={() => {
                setValue(1);
                setSlippage(1);
                setActiveButton(2);
              }}
            />
          </div>
          <div className="mt-8">
            <div className="flex flex-row items-center">
              <p className="text-left font-medium text-primary leading-7">Custom Adjustments</p>
              <div className="ml-1">
                <InfoIconWithModal title="Custom Adjustments" content="Input a custom slippage tolerance amount" />
              </div>
            </div>

            <div>
              <div className="mt-1 relative flex items-center">
                <input
                  className="block w-full pl-5 pr-16 py-3.5 border-gray-300 font-medium rounded-lg leading-none text-primaryDark focus:outline-0 focus:ring-0 focus:ring-transparent focus:border-primary shadow-sm"
                  type="number"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value === "" ? 0 : Number(e.target.value));
                    setSlippage(e.target.value === "" ? 0 : Number(e.target.value));
                  }}
                  onFocus={() => setActiveButton(3)}
                />
                <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5 items-center">
                  <p className="px-2 pb-1 pt-1.5 leading-none text-primaryDark font-medium rounded-lg">%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SlippageSettings;
