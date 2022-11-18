import React from "react";

const AvatarIcon: React.FC<{ size: number }> = ({ size }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_5532_81752)">
        <rect width="120" height="120" rx="60" fill="#D1D5DB" />
        <path
          d="M120 104.97V120.005H0V105.025C6.97975 95.6973 16.0395 88.1267 26.4589 82.9153C36.8784 77.7038 48.37 74.9953 60.02 75.005C84.54 75.005 106.32 86.775 120 104.97ZM80.01 45C80.01 50.3043 77.9029 55.3914 74.1521 59.1421C70.4014 62.8929 65.3143 65 60.01 65C54.7057 65 49.6186 62.8929 45.8679 59.1421C42.1171 55.3914 40.01 50.3043 40.01 45C40.01 39.6957 42.1171 34.6086 45.8679 30.8579C49.6186 27.1071 54.7057 25 60.01 25C65.3143 25 70.4014 27.1071 74.1521 30.8579C77.9029 34.6086 80.01 39.6957 80.01 45Z"
          fill="#F3F4F6"
        />
      </g>
      <rect x="0.5" y="0.5" width="119" height="119" rx="59.5" stroke="#D1D5DB" />
      <defs>
        <clipPath id="clip0_5532_81752">
          <rect width="120" height="120" rx="60" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default AvatarIcon;
