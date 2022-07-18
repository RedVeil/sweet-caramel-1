import StatusWithLabel from "components/Common/StatusWithLabel";
import SecondaryActionButton from "components/SecondaryActionButton";
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
      className={`flex flex-col md:flex-row w-full p-6 md:py-0 md:px-8 md:h-36 
        ${index % 2 === 0 ? "bg-rewardsBg2" : "bg-rewardsBg"}
         `}
    >
      <div className="hidden md:flex flex-row justify-between gap-2 items-center w-full">
        <StatusWithLabel label="Unlock Ends" content={formattedEndDate} />
        <StatusWithLabel label="Total Vesting Tokens" content={`${formatStakedAmount(vestingEscrow.balance)} POP`} />
        <StatusWithLabel
          label="Claimable Tokens"
          content={`${formatStakedAmount(vestingEscrow.claimableAmount)} POP`}
        />
        <div className="w-2/12">
          <SecondaryActionButton
            handleClick={() => claim(vestingEscrow)}
            disabled={!vestingEscrow.claimableAmount.gte(0)}
            grayOutline={true}
            label="Claim"
          />
        </div>
      </div>
      <div className="md:hidden w-full">
        <div className="flex flex-row justify-between gap-2 gap-y-6 flex-wrap">
          <StatusWithLabel
            label="Claimable Tokens"
            content={`${formatStakedAmount(vestingEscrow.claimableAmount)} POP`}
          />
          <StatusWithLabel label="Unlock Ends" content={formattedEndDate} />
          <StatusWithLabel label="Total Vesting Tokens" content={`${formatStakedAmount(vestingEscrow.balance)} POP`} />
        </div>
        <div className="w-full mt-6">
          <SecondaryActionButton
            handleClick={() => claim(vestingEscrow)}
            disabled={!vestingEscrow.claimableAmount.gte(0)}
            grayOutline={true}
            label="Claim"
          />
        </div>
      </div>
    </div>
  );
};

export default VestingRecordComponent;
