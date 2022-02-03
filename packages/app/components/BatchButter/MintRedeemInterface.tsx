import { BigNumber } from "ethers";
import { Dispatch } from "react";
import { BatchType } from "../../../hardhat/lib/adapters";
import MainActionButton from "../MainActionButton";
import MintRedeemToggle from "./MintRedeemToggle";
import SlippageSettings from "./SlippageSettings";
import TokenInput, { TokenInputProps } from "./TokenInput";
interface MintRedeemInterfaceProps extends TokenInputProps {
  deposit: (depositAmount: BigNumber, batchType: BatchType) => Promise<void>;
  approve: (contractKey: string) => Promise<void>;
  slippage: number;
  setSlippage: Dispatch<number>;
  hasUnclaimedBalances: boolean;
}

const MintRedeemInterface: React.FC<MintRedeemInterfaceProps> = ({
  token,
  selectedToken,
  selectToken,
  redeeming,
  setRedeeming,
  depositAmount,
  setDepositAmount,
  deposit,
  approve,
  depositDisabled,
  useUnclaimedDeposits,
  setUseUnclaimedDeposits,
  slippage,
  setSlippage,
  hasUnclaimedBalances,
}) => {
  return (
    <div className="bg-white rounded-3xl px-5 pt-6 pb-10 mr-8 border border-gray-200 shadow-custom">
      <MintRedeemToggle redeeming={redeeming} setRedeeming={setRedeeming} />
      <TokenInput
        token={token}
        selectedToken={selectedToken}
        selectToken={selectToken}
        redeeming={redeeming}
        setRedeeming={setRedeeming}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        useUnclaimedDeposits={useUnclaimedDeposits}
        setUseUnclaimedDeposits={setUseUnclaimedDeposits}
        depositDisabled={depositDisabled}
        hasUnclaimedBalances={hasUnclaimedBalances}
      />
      <div className="w-full">
        {!redeeming && selectedToken.input.key !== "threeCrv" && (
          <SlippageSettings slippage={slippage} setSlippage={setSlippage} />
        )}
      </div>
      {!depositDisabled && !redeeming && (
        <div className="pt-6">
          <div className="flex flex-row justify-between">
            <p className="text-base leading-none mt-0.5 ml-2t text-gray-500">Slippage</p>
            <p className="text-base font-semibold leading-none mt-0.5 ml-2t text-gray-500">{slippage} %</p>
          </div>
        </div>
      )}
      <div className="w-full text-center lg:mt-9 lglaptop:mt-10 xl:mt-14 2xl:mt-212 smlaptop:mb-1 lglaptop:mb-1 xl:mb-3.5 2xl:mb-1.5">
        {depositAmount.gt(selectedToken.input.allowance) ? (
          <div className="space-y-4">
            <MainActionButton
              label={`Allow Popcorn to use your ${selectedToken.input.name}`}
              handleClick={(e) => approve(selectedToken.input.key)}
              disabled={true}
            />
            <MainActionButton
              label={redeeming ? "Redeem" : "Mint"}
              handleClick={(e) => deposit(depositAmount, redeeming ? BatchType.Redeem : BatchType.Mint)}
              disabled={true}
            />
          </div>
        ) : (
          <div className="pt-6">
            <MainActionButton
              label={redeeming ? "Redeem" : "Mint"}
              handleClick={(e) => deposit(depositAmount, redeeming ? BatchType.Redeem : BatchType.Mint)}
              disabled={depositDisabled}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export default MintRedeemInterface;
