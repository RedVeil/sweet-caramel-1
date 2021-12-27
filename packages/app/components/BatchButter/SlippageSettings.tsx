import { InfoIconWithModal } from 'components/InfoIconWithModal';
import { Dispatch, useState } from 'react';
import PseudoRadioButton from './PseudoRadioButton';

interface SlippageSettingsProps {
  slippage: number;
  setSlippage: Dispatch<number>;
}

const SlippageSettings: React.FC<SlippageSettingsProps> = ({
  slippage,
  setSlippage,
}) => {
  const [visible, setVisibility] = useState<boolean>(false);
  const [activeButton, setActiveButton] = useState<number>(0);
  const [value, setValue] = useState<number>(slippage);

  return (
    <>
      <div
        className="flex flex-row items-center mt-3 group cursor-pointer"
        onClick={() => setVisibility(!visible)}
      >
        <img
          className={`w-5 h-5  group-hover:text-blue-600 ${
            visible ? '' : 'text-gray-500'
          }`}
          src="/images/icons/slippage.png"
        />
        <p
          className={`text-base leading-none mt-0.5 ml-2 group-hover:text-blue-600 ${
            visible ? 'font-bold' : 'text-gray-500'
          }`}
        >
          Adjust slippage
        </p>
      </div>
      {visible && (
        <div className="mt-2 border border-gray-200 px-6 pt-2 pb-4 rounded-lg">
          <div className="flex flex-row items-center">
            <p className="text-left">Slippage Tolerance</p>
            <InfoIconWithModal
              title="Slippage Tolerance"
              content="Your transaction will revert if the price changes unfavorable by more than this percentage"
              size="h-6 w-6"
            />
          </div>
          <div className="flex flex-row items-center mt-2 space-x-4">
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
          <div className="mt-4">
            <p className="mb-1 text-left">Custom Adjustments</p>
            <div className="border border-gray-300 rounded-lg pr-4 w-60 flex flex-row items-center">
              <input
                className="w-10/12 py-3 mx-auto border-none text-sm focus:outline-none"
                type="number"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value === '' ? 0 : Number(e.target.value));
                  setSlippage(
                    e.target.value === '' ? 0 : Number(e.target.value),
                  );
                }}
                onFocus={() => setActiveButton(3)}
              />
              <p className="text-sm">%</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SlippageSettings;
