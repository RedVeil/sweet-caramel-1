import StatusWithLabel from "components/Common/StatusWithLabel";
import MainActionButton from "components/MainActionButton";
import { format } from "date-fns";
import { formatStakedAmount } from "helper/formatAmount";
import { Escrow } from "hooks/useGetUserEscrows";

interface VestingRecordProps {
  vestingEscrow: Escrow;
  index: number;
  claim: (Escrow) => void;
}

const VestingRecordComponent: React.FC<VestingRecordProps> = ({ vestingEscrow, index, claim }) => {
  const formattedEndDate = format(vestingEscrow.end.toNumber(), "MM.dd.yyyy");

  return (
    <div
      className={`flex flex-col md:flex-row w-full 
         `}
    >
      <div className="hidden md:flex flex-row justify-between gap-2 items-center w-full border-b border-customLightGray p-8">
        <StatusWithLabel label="Unlock Ends" content={formattedEndDate} />
        <StatusWithLabel label="Total Vesting Tokens" content={`${formatStakedAmount(vestingEscrow.balance)} POP`} />
        <StatusWithLabel
          label="Claimable Tokens"
          content={`${formatStakedAmount(vestingEscrow.claimableAmount)} POP`}
        />
        <div className="w-2/12">
          <MainActionButton
            handleClick={() => claim(vestingEscrow)}
            disabled={!vestingEscrow.claimableAmount.gte(0)}
            label="Claim"
          />
        </div>
      </div>
      <div className="md:hidden w-full border-b border-customLightGray py-6">
        <StatusWithLabel label="Unlock Ends" content={formattedEndDate} />
        <div className="flex flex-row justify-between gap-2 gap-y-6 flex-wrap mt-6">
          <StatusWithLabel
            label="Claimable Tokens"
            content={`${formatStakedAmount(vestingEscrow.claimableAmount)} POP`}
          />
          <StatusWithLabel label="Total Vesting Tokens" content={`${formatStakedAmount(vestingEscrow.balance)} POP`} />
        </div>
        <div className="w-full mt-6">
          <MainActionButton
            handleClick={() => claim(vestingEscrow)}
            disabled={!vestingEscrow.claimableAmount.gte(0)}
            label="Claim"
          />
        </div>
      </div>
    </div>
  );
};

export default VestingRecordComponent;
