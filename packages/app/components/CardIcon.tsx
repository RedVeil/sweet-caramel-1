import * as Icon from 'react-feather';

function getIcon(icon: string): JSX.Element {
  switch (icon) {
    case 'Lock':
      return <Icon.Lock />;
    case 'Gift':
      return <Icon.Gift />;
    case 'Money':
      return <Icon.DollarSign />;
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
    <div className={`w-12 h-12 rounded-full flex ${color}`}>
      <div
        className={`ml-3 mt-3 w-4 h-4 ${iconColor ? iconColor : 'text-white'}`}
      >
        {getIcon(icon)}
      </div>
    </div>
  );
}
