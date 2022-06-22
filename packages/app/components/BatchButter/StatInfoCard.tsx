import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import CardIcon, { IconProps } from "../CardIcon";
import { InfoIconWithModalProps } from "../InfoIconWithModal";

interface StatInfoCardProps {
  title: string;
  content: string | React.ReactElement;
  icon: IconProps;
  info?: InfoIconWithModalProps;
}
export default function StatInfoCard({ title, content, icon, info }: StatInfoCardProps): JSX.Element {
  return (
    <div className="bg-white border border-gray-200 shadow-custom rounded-3xl h-full flex flex-col">
      <div className="w-full flex flex-row px-6 pt-6 pb-3 xs:pb-6 h-full items-center justify-center">
        <CardIcon icon={icon} />
        <div className="ml-4 w-full">
          <div className="flex flex-row items-center w-full justify-between pt-1">
            <p className="font-normal leading-none text-gray-500 text-base uppercase">{title}</p>
            <InfoIconWithTooltip
              classExtras="h-7 w-7 mt-0 ml-5"
              id={info.title}
              title={info.title}
              content={info.content}
            />
          </div>
          <h3 className="text-3xl font-semibold text-gray-900 mt-2">{content}</h3>
        </div>
      </div>
    </div>
  );
}
