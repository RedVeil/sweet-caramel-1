import { BigNumber, constants } from "ethers";
import { useState } from "react";
import * as Icon from "react-feather";
import TokenInput from "../Common/TokenInput";
import MainActionButton from "../MainActionButton";

interface AirDropClaimProps {
  redeem: (redeemAmount: BigNumber) => Promise<void>;
  approve: () => Promise<void>;
  balances: { wallet: BigNumber; allowance: BigNumber };
}

const AirDropClaim: React.FC<AirDropClaimProps> = ({ redeem, balances, approve }) => {
  const [inputAmount, setInputAmount] = useState<BigNumber>(BigNumber.from(0));
  const [displayAmount, setDisplayAmount] = useState("");

  return (
    <div className="bg-white rounded-3xl px-5 pt-14 pb-6 border border-gray-200 shadow-custom">
      <div className="flex flex-row justify-between items-start">
        <TokenInput
          displayAmount={displayAmount}
          setDisplayAmount={setDisplayAmount}
          tokenName={"XPOP"}
          label={"Redeem Amount"}
          balance={balances.wallet}
          inputAmount={inputAmount}
          updateInputAmount={(n) => setInputAmount(n)}
          maxButton={true}
        />
        <div className="h-16 w-16 mx-8 flex justify-center items-center rounded-full border border-gray-400 bg-transparent border-width-1  mt-6">
          <div className="w-16 h-16 flex justify-center items-center">
            <Icon.ArrowRight height={32} width={32} strokeWidth={1.5} className="color-gray-400" />
          </div>
        </div>
        <div className="w-full mt-6">
          <TokenInput
            displayAmount={displayAmount}
            setDisplayAmount={() => null}
            tokenName={"POP"}
            label={""}
            inputAmount={inputAmount}
            updateInputAmount={(n) => setInputAmount(n)}
            maxButton={false}
            readonly
          />
        </div>
      </div>
      <div className="w-full text-center mt-10 space-y-4">
        {(balances.allowance.lte(BigNumber.from(0)) || balances.allowance.lt(inputAmount)) && (
          <MainActionButton label={`Approve XPOP`} handleClick={approve} />
        )}
        <MainActionButton
          label="Redeem"
          disabled={balances.allowance.lte(constants.Zero) || balances.allowance.lt(inputAmount)}
          handleClick={() => {
            redeem(inputAmount).then((res) => {
              setInputAmount(BigNumber.from(0));
              setDisplayAmount("");
            });
          }}
        />
      </div>
    </div>
  );
};
export default AirDropClaim;
