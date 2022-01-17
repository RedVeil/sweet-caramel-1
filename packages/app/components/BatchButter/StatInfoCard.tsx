import CardIcon, { CardIconProps } from '../CardIcon';
import {
  InfoIconWithModal,
  InfoIconWithModalProps,
} from '../InfoIconWithModal';

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
    <div className="flex flex-col justify-center bg-white h-full rounded-3xl border border-gray-200 shadow-custom w-full px-6 pt-8 smlaptop:pt-5 pb-8 smlaptop:pb-5">
      <div className="flex flex-row items-center justify-between mt-0.5">
        <div className="flex h-16 flex-row">
          <CardIcon
            icon={icon.icon}
            color={icon.color}
            iconColor={icon.iconColor}
          />
          <div className="ml-4">
            <p className="font-light text-gray-500 text-base leading-none uppercase mt-1">
              {title}
            </p>
            <h3 className="text-3xl font-medium text-gray-900 mt-2 pt-1">
              {content}
            </h3>
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
