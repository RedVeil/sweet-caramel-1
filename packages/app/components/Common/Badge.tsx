import { FC } from "react";

export interface Badge {
  text: string;
  textColor: string;
  bgColor: string;
}

interface BadgeProps {
  badge: Badge;
}

const Badge: FC<BadgeProps> = ({ badge }) => {
  return (
    <>
      {badge && Object.keys(badge)?.length > 0 ? (
        <div className={`py-2 px-4 rounded-lg ${badge.textColor} ${badge.bgColor}`}>{badge.text}</div>
      ) : null}
    </>
  );
};

export default Badge;
