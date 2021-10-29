import * as Icon from 'react-feather';

function getIcon(icon: string): JSX.Element {
  switch (icon) {
    case 'Lock':
      return <Icon.Lock />;
    case 'Gift':
      return <Icon.Gift />;
  }
}

export interface CardIconProps {
  icon: string;
  color: string;
}

export default function CardIcon({ icon, color }: CardIconProps): JSX.Element {
  return (
    <div className={`w-12 h-12 rounded-full flex ${color}`}>
      <div className="text-white ml-3 mt-3 w-4 h-4">{getIcon(icon)}</div>
    </div>
  );
}
