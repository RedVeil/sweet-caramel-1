import React from "react";

interface ButtonProps {
  label: string;
  handleClick?: any;
  disabled?: boolean;
}
const MainActionButton: React.FC<ButtonProps> = ({ label, handleClick, disabled = false, children }) => {
  return (
    <button
      className="bg-ctaYellow border-ctaYellow text-black hover:bg-primary hover:border-primary hover:text-white active:bg-white active:border-primary active:text-primary rounded-4xl px-8 py-3 font-medium text-base transition-all ease-in-out duration-500 w-full"
      onClick={handleClick}
    >
      {label}
    </button>
  );
};

export default MainActionButton;
