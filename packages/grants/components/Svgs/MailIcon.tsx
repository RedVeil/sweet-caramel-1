import React from "react";

interface IconProps {
  color: string;
  size: string;
}
const MailIcon: React.FC<IconProps> = ({ color, size }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 39 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.690594 4.396L19.3503 13.7247L38.0099 4.396C37.9408 3.20704 37.4198 2.08947 36.5535 1.2722C35.6872 0.454919 34.5412 -0.000218364 33.3503 7.85946e-08H5.35026C4.15929 -0.000218364 3.0133 0.454919 2.14701 1.2722C1.28071 2.08947 0.75967 3.20704 0.690594 4.396Z"
        fill={color}
      />
      <path
        d="M38.0169 9.60867L19.3503 18.942L0.683594 9.60867V23.3333C0.683594 24.571 1.17526 25.758 2.05043 26.6332C2.9256 27.5083 4.11258 28 5.35026 28H33.3503C34.5879 28 35.7749 27.5083 36.6501 26.6332C37.5252 25.758 38.0169 24.571 38.0169 23.3333V9.60867Z"
        fill={color}
      />
    </svg>
  );
};

export default MailIcon;
