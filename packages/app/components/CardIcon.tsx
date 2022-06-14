import * as Icon from "react-feather";

function getIcon(icon: IconProps): JSX.Element {
  switch (icon.name) {
    case "Lock":
      return <Icon.Lock />;
    case "Gift":
      return <Icon.Gift />;
    case "Money":
      return <Icon.DollarSign />;
    case "Key":
      return <Icon.Key />;
    case "Wait":
      return <Icon.Clock />;
  }
}

export interface IconProps {
  name: string;
  color: string;
  iconColor?: string;
}
export interface CardIconProps {
  icon: IconProps;
}

export default function CardIcon({ icon }: CardIconProps): JSX.Element {
  switch (icon.name) {
    case "Butter":
      return (
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 flex-grow-0 ${icon.color}`}
        >
          <img src="/images/icons/butterLogo.png" alt="butter" className="w-8 h-5 mx-auto" />
        </div>
      );
    case "3X":
      return (
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 flex-grow-0 ${icon.color}`}
        >
          <img src="/images/tokens/threeX.svg" alt="3x" className="w-16 h-10 mb-1 mx-auto" />
        </div>
      );
    default:
      return (
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 flex-grow-0 ${icon.color}`}
        >
          <div className={`w-6 h-6 ${icon.iconColor ? icon.iconColor : "text-white"}`}>{getIcon(icon)}</div>
        </div>
      );
  }
}
