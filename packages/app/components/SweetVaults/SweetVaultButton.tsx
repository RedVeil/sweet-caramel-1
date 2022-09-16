import { Token } from "@popcorn/utils/types";
import MainActionButton from "components/MainActionButton";
import { BigNumber, constants } from "ethers";

interface SweetVaultButtonProps {
  mainActionLabel: string;
  mainAction: Function;
  approve: Function;
  inputAmount: BigNumber;
  allowance: BigNumber;
  selectedToken: Token;
}

export default function SweetVaultButton({
  mainActionLabel,
  mainAction,
  approve,
  inputAmount,
  allowance,
  selectedToken,
}: SweetVaultButtonProps): JSX.Element {
  return !inputAmount || !allowance || inputAmount?.gt(allowance) ? (
    <div className="space-y-4">
      <MainActionButton label={`Approve ${selectedToken?.name}`} handleClick={approve} />
      <MainActionButton label={mainActionLabel} handleClick={() => {}} disabled={true} />
    </div>
  ) : (
    <div className="">
      <MainActionButton
        label={mainActionLabel}
        handleClick={mainAction}
        disabled={inputAmount?.eq(constants.Zero) || inputAmount?.gt(selectedToken?.balance)}
      />
    </div>
  );
}
