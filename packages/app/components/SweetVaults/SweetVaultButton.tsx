import { Token } from "@popcorn/utils/types";
import MainActionButton from "components/MainActionButton";
import { BigNumber } from "ethers";

interface SweetVaultButtonProps {
  mainActionLabel: string;
  mainAction: Function;
  approve: Function;
  inputAmount: BigNumber;
  allowance: BigNumber;
  selectedToken: Token;
  disabled: boolean;
}

export default function SweetVaultButton({
  mainActionLabel,
  mainAction,
  approve,
  inputAmount,
  allowance,
  selectedToken,
  disabled,
}: SweetVaultButtonProps): JSX.Element {
  return !inputAmount || !allowance || inputAmount?.gt(allowance) ? (
    <div className="space-y-4">
      <MainActionButton disabled={disabled} label={`Approve ${selectedToken?.name}`} handleClick={approve} />
      <MainActionButton label={mainActionLabel} handleClick={() => {}} disabled={true} />
    </div>
  ) : (
    <div className="">
      <MainActionButton label={mainActionLabel} handleClick={mainAction} disabled={disabled} />
    </div>
  );
}
