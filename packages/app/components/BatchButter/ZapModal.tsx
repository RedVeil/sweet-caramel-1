import { BigNumber } from "@ethersproject/bignumber";
import { Token } from "@popcorn/utils/types";
import MainActionButton from "components/MainActionButton";
import TertiaryActionButton from "components/TertiaryActionButton";
import { Dispatch, useState } from "react";
import OutputToken from "./OutputToken";
import SlippageSettings from "./SlippageSettings";

interface ZapModalProps {
  tokenOptions: Token[];
  slippage: number;
  setSlippage: Dispatch<number>;
  slippageOptions: number[];
  closeModal: Function;
  withdraw: Function;
  claim: Function;
  batchId: string;
  withdrawAmount: BigNumber;
  isWithdraw?: boolean;
}

export default function ZapModal({
  tokenOptions,
  slippage,
  setSlippage,
  slippageOptions,
  closeModal,
  withdraw,
  claim,
  batchId,
  withdrawAmount,
  isWithdraw = false,
}: ZapModalProps): JSX.Element {
  const [selectedToken, selectToken] = useState<Token>(tokenOptions[0]);

  return (
    <div className="flex flex-col mt-4 mx-4">
      <OutputToken outputToken={tokenOptions} selectToken={selectToken} selectedToken={selectedToken} />
      {selectedToken !== tokenOptions[0] && (
        <div className="mt-4">
          <SlippageSettings slippage={slippage} setSlippage={setSlippage} slippageOptions={slippageOptions} />
        </div>
      )}
      <div className="mt-5 flex flex-row space-x-4 md:space-x-8">
        <TertiaryActionButton
          label={"Cancel"}
          handleClick={() => {
            closeModal();
          }}
        ></TertiaryActionButton>
        <MainActionButton
          label={isWithdraw ? "Withdraw" : "Claim"}
          handleClick={() => {
            isWithdraw
              ? withdraw(batchId, withdrawAmount, selectedToken !== tokenOptions[0], selectedToken)
              : claim(batchId, selectedToken !== tokenOptions[0], selectedToken);
            closeModal();
          }}
        ></MainActionButton>
      </div>
    </div>
  );
}
