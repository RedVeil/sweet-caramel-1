import * as Icon from 'react-feather';

function getIcon(icon: string): JSX.Element {
  switch (icon) {
    case 'Lock':
      return <Icon.Lock />;
    case 'Gift':
      return <Icon.Gift />;
    case 'Money':
      return <Icon.DollarSign />;
    case 'Key':
      return <Icon.Key />;
    case 'Wait':
      return <Icon.Clock />;
  }
}

export interface CardIconProps {
  icon: string;
  color: string;
  iconColor?: string;
}

export default function CardIcon({
  icon,
  color,
  iconColor,
}: CardIconProps): JSX.Element {
  return (
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 flex-grow-0 ${color}`}
    >
      <div className={`w-6 h-6 ${iconColor ? iconColor : 'text-white'}`}>
        {getIcon(icon)}
      </div>
    </div>
  );
}
