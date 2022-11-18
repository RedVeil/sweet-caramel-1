import React from "react";

interface IconProps {
  color: string;
  size: string;
}
const CopyIcon: React.FC<IconProps> = ({ color, size }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.8125 20.6104C16.5042 21.5351 17.3867 22.3002 18.4001 22.8539C19.4135 23.4076 20.5342 23.7369 21.686 23.8193C22.8379 23.9018 23.994 23.7356 25.076 23.332C26.158 22.9284 27.1405 22.2968 27.957 21.4801L32.789 16.6481C34.2559 15.1292 35.0677 13.0949 35.0493 10.9834C35.031 8.87181 34.184 6.85193 32.6909 5.35877C31.1977 3.86562 29.1778 3.01865 27.0663 3.0003C24.9547 2.98196 22.9204 3.79369 21.4015 5.26067L18.6312 8.01492"
        stroke={color}
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M22.2528 17.3897C21.561 16.465 20.6786 15.6998 19.6651 15.1462C18.6517 14.5925 17.5311 14.2632 16.3792 14.1807C15.2273 14.0982 14.0712 14.2644 12.9892 14.668C11.9073 15.0717 10.9247 15.7032 10.1083 16.52L5.2763 21.352C3.80931 22.8708 2.99758 24.9051 3.01593 27.0167C3.03428 29.1283 3.88124 31.1481 5.3744 32.6413C6.86755 34.1345 8.88743 34.9814 10.999 34.9998C13.1106 35.0181 15.1448 34.2064 16.6637 32.7394L19.418 29.9852"
        stroke={color}
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default CopyIcon;