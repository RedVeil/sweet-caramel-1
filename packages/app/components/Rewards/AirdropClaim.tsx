import { Token } from "@popcorn/utils/types";
import { BigNumber, constants } from "ethers";
import { useState } from "react";
import * as Icon from "react-feather";
import TokenInput from "../Common/TokenInput";
import MainActionButton from "../MainActionButton";

interface AirDropClaimProps {
  redeem: (redeemAmount: BigNumber) => Promise<void>;
  approve: () => Promise<void>;
  balances: { balance: BigNumber; allowance: BigNumber }[];
  tokens: Token[];
}

const AirDropClaim: React.FC<AirDropClaimProps> = ({ redeem, balances, approve, tokens }) => {
  const [inputAmount, setInputAmount] = useState<BigNumber>(BigNumber.from(0));

  return (
    <div className="bg-white rounded-3xl px-5 pt-14 pb-6 border border-gray-200 shadow-custom">
      <div className="flex flex-row justify-between items-start">
        <TokenInput
          token={tokens[0]}
          label={"Redeem Amount"}
          balance={balances[0].balance}
          amount={inputAmount}
          setAmount={(n) => setInputAmount(n)}
        />
        <div className="h-16 w-16 mx-8 flex justify-center items-center rounded-full border border-gray-400 bg-transparent border-width-1  mt-6">
          <div className="w-16 h-16 flex justify-center items-center">
            <Icon.ArrowRight height={24} width={24} strokeWidth={1.5} color="gray" />
          </div>
        </div>
        <div className="w-full mt-6">
          <TokenInput token={tokens[1]} label={""} amount={inputAmount} setAmount={(n) => setInputAmount(n)} readonly />
        </div>
      </div>
      <div className="w-full text-center mt-10 space-y-4">
        {(balances[0].allowance.lte(BigNumber.from(0)) || balances[0].allowance.lt(inputAmount)) && (
          <MainActionButton label={`Approve XPOP`} handleClick={approve} />
        )}
        <MainActionButton
          label="Redeem"
          disabled={
            inputAmount.isZero() ||
            inputAmount.gte(balances[0].allowance) ||
            balances[0].allowance.lte(constants.Zero) ||
            balances[0].allowance.lt(inputAmount)
          }
          handleClick={() => {
            redeem(inputAmount).then((res) => {
              setInputAmount(BigNumber.from(0));
            });
          }}
        />
      </div>
    </div>
  );
};
export default AirDropClaim;
