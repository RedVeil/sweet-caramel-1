import CardIcon, { CardIconProps } from './CardIcon';
import { InfoIconWithModal, InfoIconWithModalProps } from './InfoIconWithModal';

interface StatInfoCardProps {
  title: string;
  content: string;
  icon: CardIconProps;
  info?: InfoIconWithModalProps;
}
export default function StatInfoCard({
  title,
  content,
  icon,
  info,
}: StatInfoCardProps): JSX.Element {
  return (
    <div className="bg-white rounded-md border border-gray-200 w-full px-4 py-5">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          <CardIcon
            icon={icon.icon}
            color={icon.color}
            iconColor={icon.iconColor}
          />
          <div className="ml-4">
            <p className="text-gray-500 font-light uppercase">{title}</p>
            <h3 className="text-xl font-medium text-gray-800">{content}</h3>
          </div>
        </div>
        <div>
          {info && (
            <InfoIconWithModal
              title={info.title}
              content={info.content}
              children={info.children}
            />
          )}
        </div>
      </div>
    </div>
  );
}
