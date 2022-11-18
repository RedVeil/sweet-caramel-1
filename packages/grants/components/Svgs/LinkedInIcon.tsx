import React from "react";

interface IconProps {
  color: string;
  size: string;
}
const LinkedInIcon: React.FC<IconProps> = ({ color, size }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M39.9985 40.7454C40.4127 40.7454 40.7485 40.4096 40.7485 39.9954V27.3293C40.7485 24.251 39.5256 21.2988 37.349 19.1222C35.1723 16.9455 32.2201 15.7227 29.1418 15.7227C26.0635 15.7227 23.1113 16.9455 20.9347 19.1222C18.758 21.2988 17.5352 24.251 17.5352 27.3293V39.9954C17.5352 40.4096 17.8709 40.7454 18.2852 40.7454H25.5229C25.9371 40.7454 26.2729 40.4096 26.2729 39.9954V27.3293C26.2729 26.5684 26.5752 25.8387 27.1132 25.3007C27.6512 24.7627 28.3809 24.4604 29.1418 24.4604C29.9027 24.4604 30.6324 24.7627 31.1704 25.3007C31.7084 25.8387 32.0107 26.5684 32.0107 27.3293V39.9954C32.0107 40.4096 32.3465 40.7454 32.7607 40.7454H39.9985Z"
        className={color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M9.98582 18.2871C9.98582 17.8729 9.65003 17.5371 9.23582 17.5371H1.99805C1.58383 17.5371 1.24805 17.8729 1.24805 18.2871V40.0004C1.24805 40.4146 1.58383 40.7504 1.99805 40.7504H9.23582C9.65003 40.7504 9.98582 40.4146 9.98582 40.0004V18.2871Z"
        className={color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M5.61693 9.98777C8.0298 9.98777 9.98582 8.03175 9.98582 5.61888C9.98582 3.20602 8.0298 1.25 5.61693 1.25C3.20406 1.25 1.24805 3.20602 1.24805 5.61888C1.24805 8.03175 3.20406 9.98777 5.61693 9.98777Z"
        className={color}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

export default LinkedInIcon;