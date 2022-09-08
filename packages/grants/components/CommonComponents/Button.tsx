import React from "react";

interface ButtonProps {
  variant: string;
  className: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ variant, children, className, onClick, disabled }) => {
  const buttonVariant = () => {
    switch (variant) {
      case "primary":
        if (disabled) return "bg-gray-300 text-white ";
        return "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 active:bg-blue-900 active:text-white";
      case "secondary":
        if (disabled) return "bg-white text-gray-300";
        return "bg-white border-blue-600 text-blue-600 hover:bg-blue-700 hover:text-white active:bg-blue-900 active:text-white";
      case "tertiary":
        if (disabled) return "bg-gray-100 text-gray-500";
        return "bg-blue-100 border-blue-100 text-blue-600 hover:text-white hover:bg-blue-500 hover:border-blue-700 active:bg-blue-500 active:border-blue-500 active:text-white";
      default:
        return "";
    }
  };
  return (
    <button
      className={`rounded-button font-semibold border shadow-md transition-all ease-in-out ${className} ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } ${buttonVariant()}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
