import React from "react";

interface CaretProps {
  className?: string;
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
}
const CaretIcon: React.FC<CaretProps> = ({ className, onClick }) => {
  return (
    <svg
      width="22"
      height="9"
      viewBox="0 0 22 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
    >
      <path d="M21 1L11 8L1 1" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default CaretIcon;
