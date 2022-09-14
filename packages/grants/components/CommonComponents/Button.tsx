import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  children: any;
}

const Button: React.FC<ButtonProps> = ({ variant, children, className, onClick, disabled }) => {
  const buttonVariant = () => {
    switch (variant) {
      case "primary":
        if (disabled)
          return "bg-customLightGray border-customLightGray text-secondaryLight hover:border-customLightGray hover:bg-customLightGray hover:text-secondaryLight";
        return "bg-warmGray border-ctaYellow text-black hover:bg-primary hover:border-primary hover:text-white active:bg-white active:border-primary active:text-primary";
      case "secondary":
        if (disabled)
          return "bg-customLightGray border-customLightGray text-secondaryLight hover:border-customLightGray hover:bg-customLightGray hover:text-secondaryLight";
        return "px-8 py-3 font-medium bg-white border border-primary text-primary hover:bg-primary hover:border-primary hover:text-white active:bg-white active:border-primary active:text-primary";
      case "tertiary":
        if (disabled) return "bg-gray-100 text-gray-500";
        return "bg-blue-100 border-blue-100 text-blue-600 hover:text-white hover:bg-blue-500 hover:border-blue-700 active:bg-blue-500 active:border-blue-500 active:text-white";
      default:
        return "";
    }
  };
  return (
    <button
      className={`rounded-4xl text-base flex flex-row items-center justify-center font-medium px-8 py-[10px] border transition-all ease-in-out duration-500 ${className} ${
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
