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
        return "cursor-pointer bg-warmGray border-warmGray text-black hover:bg-primary hover:border-primary hover:text-white disabled:bg-customLightGray disabled:border-customLightGray disabled:text-white disabled:hover:border-customLightGray disabled:hover:bg-customLightGray disabled:hover:text-secondaryLight disabled:cursor-not-allowed";
      case "secondary":
        return "cursor-pointer px-8 py-3 font-medium bg-transparent border border-primary text-primary hover:bg-primary hover:border-primary hover:text-white disabled:bg-customLightGray disabled:border-customLightGray disabled:text-white disabled:hover:border-customLightGray disabled:hover:bg-customLightGray disabled:hover:text-secondaryLight disabled:cursor-not-allowed";
      case "tertiary":
        return "cursor-pointer bg-primary border-primary text-white disabled:bg-customLightGray disabled:border-customLightGray disabled:text-secondaryLight disabled:hover:border-customLightGray disabled:hover:bg-customLightGray disabled:hover:text-secondaryLight disabled:cursor-not-allowed";
      default:
        return "";
    }
  };
  return (
    <button
      className={`rounded-4xl text-base flex flex-row items-center justify-center font-medium px-8 py-[10px] border transition-all ease-in-out duration-500 ${buttonVariant()} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
