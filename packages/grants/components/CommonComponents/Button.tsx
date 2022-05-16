import React from "react";

interface ButtonProps {
  variant: string;
  className: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const Button: React.FC<ButtonProps> = ({ variant, children, className, onClick }) => {
  return (
    <button
      className={`rounded-button font-semibold border shadow-md ${className} ${
        variant == "primary"
          ? "bg-blue-600 border-blue-600 text-white"
          : variant == "secondary"
          ? "bg-blue-100 border-blue-100 text-blue-600"
          : "bg-white border-blue-600 text-blue-600"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
