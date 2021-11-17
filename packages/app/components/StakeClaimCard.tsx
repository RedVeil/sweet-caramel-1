import CardIcon, { CardIconProps } from './CardIcon';
import CardInfoSegment, { CardInfoSegmentProps } from './CardInfoSegment';
import MainActionButton from './MainActionButton';

interface StakeClaimCardProps {
  title: string;
  icon: CardIconProps;
  infos: CardInfoSegmentProps[];
  buttonLabel: string;
  handleClick: Function;
}

const StakeClaimCard: React.FC<StakeClaimCardProps> = ({
  title,
  icon,
  infos,
  buttonLabel,
  handleClick,
}) => {
  return (
    <div className="w-1/3 rounded-md shadow bg-white mr-4 py-4">
      <div className="flex flex-row items-center px-4 justify-between">
        <CardIcon icon={icon.icon} color={icon.color} />
        <h1 className="text-xl text-gray-800 font-medium">{title}</h1>
        {/* Exists only for Spacing */}
        <div className="w-4 h-4"></div>
      </div>
      <div className="border-b border-gray-200 py-2"></div>
      <div className="px-4">
        <div className="space-y-4 mt-4">
          {infos.map((info) => (
            <CardInfoSegment title={info.title} info={info.info} />
          ))}
        </div>
        <div className="mt-8">
          <MainActionButton label={buttonLabel} handleClick={handleClick} />
        </div>
      </div>
    </div>
  );
};
export default StakeClaimCard;
