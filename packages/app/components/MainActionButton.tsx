import React from "react";

interface ButtonProps {
  label: string;
  handleClick?: any;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}
const MainActionButton: React.FC<ButtonProps> = ({ label, handleClick, disabled = false, type = "button" }) => {
  return (
    <button
      className="bg-warmGray border-ctaYellow text-black hover:bg-primary hover:border-primary hover:text-white active:bg-white active:border-primary active:text-primary rounded-4xl px-8 py-3 font-medium text-base transition-all ease-in-out duration-500 w-full disabled:bg-customLightGray disabled:border-customLightGray disabled:text-secondaryLight disabled:hover:border-customLightGray disabled:hover:bg-customLightGray disabled:hover:text-secondaryLight"
      onClick={handleClick}
      type={type}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default MainActionButton;
