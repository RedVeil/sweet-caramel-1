import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import MainActionButton from "components/MainActionButton";

interface RewardSummaryCardProps {
  iconUri: string;
  title: string;
  content: string;
  button?: boolean;
  handleClick?: Function;
}

const RewardSummaryCard: React.FC<RewardSummaryCardProps> = ({ button, title, content, iconUri, handleClick }) => {
  return (
    <div className="bg-white border border-gray-200 py-6 px-6 shadow-custom rounded-2xl h-min-content w-full flex flex-col">
      <div className="w-full flex flex-row flex-wrap sm:nowrap gap-y-4 h-full gap-x-6 items-center justify-start">
        <div className="flex flex-row w-full sm:w-fit items-center gap-x-4">
          <img src={iconUri} className="w-12 h-12" />
          <div className="flex flex-col items-start grow w-full justify-between pt-1">
            <div className="flex flex-row justify-between sm:justify-start w-full items-start">
              <p className="font-normal leading-none text-gray-500 uppercase text-base">{title}</p>
              <InfoIconWithTooltip
                classExtras="h-7 w-7 -mt-2 ml-2"
                id="3"
                title="Batch Processing"
                content="Mint and redeem requests are processed manually approximately every 48 hours or when a batch reaches 100k"
              />
            </div>
            <p className="text-gray-900 font-semibold leading-snug break-words text-2xl">{content}</p>
          </div>
        </div>
        {button && (
          <div className="grow flex flex-row justify-end">
            <div className="flex-row self-center grow sm:grow-0 sm:w-32 flex">
              <MainActionButton label="Claim all" handleClick={handleClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default RewardSummaryCard;
