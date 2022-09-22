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
        return "bg-warmGray border-warmGray text-black hover:bg-primary hover:border-primary hover:text-white";
      case "secondary":
        if (disabled)
          return "bg-customLightGray border-customLightGray text-secondaryLight hover:border-customLightGray hover:bg-customLightGray hover:text-secondaryLight";
        return "px-8 py-3 font-medium bg-transparent border border-primary text-primary hover:bg-primary hover:border-primary hover:text-white";
      case "tertiary":
        if (disabled) return "bg-customLightGray border-customLightGray text-secondaryLight hover:border-customLightGray hover:bg-customLightGray hover:text-secondaryLight";
        return "bg-primary border-primary text-white";
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
